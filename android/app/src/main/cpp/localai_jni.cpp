#include <jni.h>
#include <string>
#include <vector>
#include <cstring>

#include "llama.h"

static llama_model *g_model = nullptr;
static llama_context *g_ctx = nullptr;

extern "C"
JNIEXPORT jboolean JNICALL
Java_com_lingua_assistant_plugins_LocalAIPlugin_nativeLoadModel(
    JNIEnv *env,
    jobject,
    jstring modelPath) {

    if (modelPath == nullptr) {
        return JNI_FALSE;
    }

    const char *path =
        env->GetStringUTFChars(modelPath, nullptr);

    if (path == nullptr) {
        return JNI_FALSE;
    }

    llama_backend_init();

    llama_model_params model_params =
        llama_model_default_params();

    model_params.n_gpu_layers = 0;

    g_model =
        llama_model_load_from_file(
            path,
            model_params
        );

    env->ReleaseStringUTFChars(
        modelPath,
        path
    );

    if (g_model == nullptr) {
        return JNI_FALSE;
    }

    llama_context_params ctx_params =
        llama_context_default_params();

    ctx_params.n_ctx = 2048;
    ctx_params.n_batch = 512;
    ctx_params.n_ubatch = 512;
    ctx_params.n_threads = 4;
    ctx_params.n_threads_batch = 4;

    g_ctx =
        llama_init_from_model(
            g_model,
            ctx_params
        );

    if (g_ctx == nullptr) {
        llama_model_free(g_model);
        g_model = nullptr;
        return JNI_FALSE;
    }

    return JNI_TRUE;
}

extern "C"
JNIEXPORT void JNICALL
Java_com_lingua_assistant_plugins_LocalAIPlugin_nativeUnloadModel(
    JNIEnv *,
    jobject) {

    if (g_ctx != nullptr) {
        llama_free(g_ctx);
        g_ctx = nullptr;
    }

    if (g_model != nullptr) {
        llama_model_free(g_model);
        g_model = nullptr;
    }

    llama_backend_free();
}

extern "C"
JNIEXPORT jboolean JNICALL
Java_com_lingua_assistant_plugins_LocalAIPlugin_nativeIsLoaded(
    JNIEnv *,
    jobject) {

    return (
        g_model != nullptr &&
        g_ctx != nullptr
    )
        ? JNI_TRUE
        : JNI_FALSE;
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_lingua_assistant_plugins_LocalAIPlugin_nativeGenerate(
    JNIEnv *env,
    jobject,
    jstring prompt) {

    if (
        g_model == nullptr ||
        g_ctx == nullptr ||
        prompt == nullptr
    ) {
        return env->NewStringUTF("");
    }

    const char *prompt_text =
        env->GetStringUTFChars(
            prompt,
            nullptr
        );

    if (prompt_text == nullptr) {
        return env->NewStringUTF("");
    }

    const llama_vocab *vocab =
        llama_model_get_vocab(g_model);

    if (vocab == nullptr) {
        env->ReleaseStringUTFChars(
            prompt,
            prompt_text
        );

        return env->NewStringUTF("");
    }

    /*
     * Start every independent request with
     * a completely clean KV cache.
     */
    llama_memory_t memory =
        llama_get_memory(g_ctx);

    if (memory != nullptr) {
        llama_memory_clear(
            memory,
            false
        );
    }

    /*
     * Qwen3 needs the chat template contained
     * in the GGUF model.
     */
    const char *chat_template =
        llama_model_chat_template(
            g_model,
            nullptr
        );

    if (chat_template == nullptr) {
        env->ReleaseStringUTFChars(
            prompt,
            prompt_text
        );

        return env->NewStringUTF("");
    }

    llama_chat_message message;

    message.role = "user";
    message.content = prompt_text;

    /*
     * First determine the formatted prompt size.
     */
    int32_t formatted_size =
        llama_chat_apply_template(
            chat_template,
            &message,
            1,
            true,
            nullptr,
            0
        );

    if (formatted_size <= 0) {
        env->ReleaseStringUTFChars(
            prompt,
            prompt_text
        );

        return env->NewStringUTF("");
    }

    std::vector<char> formatted_prompt(
        static_cast<size_t>(
            formatted_size
        ) + 1
    );

    formatted_size =
        llama_chat_apply_template(
            chat_template,
            &message,
            1,
            true,
            formatted_prompt.data(),
            static_cast<int32_t>(
                formatted_prompt.size()
            )
        );

    env->ReleaseStringUTFChars(
        prompt,
        prompt_text
    );

    if (formatted_size <= 0) {
        return env->NewStringUTF("");
    }

    formatted_prompt[
        static_cast<size_t>(formatted_size)
    ] = '\0';

    /*
     * Tokenize the properly formatted chat prompt.
     */
    std::vector<llama_token> tokens(2048);

    int32_t n_tokens =
        llama_tokenize(
            vocab,
            formatted_prompt.data(),
            formatted_size,
            tokens.data(),
            static_cast<int32_t>(
                tokens.size()
            ),
            true,
            true
        );

    /*
     * If the buffer was too small,
     * llama_tokenize returns the required size.
     */
    if (n_tokens < 0) {

        const int32_t required =
            -n_tokens;

        tokens.resize(
            static_cast<size_t>(
                required
            )
        );

        n_tokens =
            llama_tokenize(
                vocab,
                formatted_prompt.data(),
                formatted_size,
                tokens.data(),
                required,
                true,
                true
            );
    }

    if (n_tokens <= 0) {
        return env->NewStringUTF("");
    }

    tokens.resize(
        static_cast<size_t>(
            n_tokens
        )
    );

    /*
     * Use a real batch.
     */
    llama_batch batch =
        llama_batch_init(
            n_tokens + 1,
            0,
            1
        );

    if (batch.token == nullptr) {
        return env->NewStringUTF("");
    }

    for (int32_t i = 0; i < n_tokens; ++i) {

        batch.token[i] =
            tokens[
                static_cast<size_t>(i)
            ];

        batch.pos[i] = i;

        batch.n_seq_id[i] = 1;

        batch.seq_id[i][0] = 0;

        /*
         * We only need logits for the
         * final prompt token.
         */
        batch.logits[i] =
            (i == n_tokens - 1);
    }

    batch.n_tokens = n_tokens;

    const int decode_result =
        llama_decode(
            g_ctx,
            batch
        );

    llama_batch_free(batch);

    if (decode_result != 0) {
        return env->NewStringUTF("");
    }

    /*
     * Greedy sampling is deterministic and
     * avoids introducing sampling noise while
     * debugging the Android Qwen3 pipeline.
     */
    llama_sampler *sampler =
        llama_sampler_init_greedy();

    if (sampler == nullptr) {
        return env->NewStringUTF("");
    }

    std::string result;

    /*
     * Keep the first test short.
     */
    const int max_new_tokens = 32;

    for (int i = 0;
         i < max_new_tokens;
         ++i) {

        const llama_token token =
            llama_sampler_sample(
                sampler,
                g_ctx,
                -1
            );

        if (
            llama_vocab_is_eog(
                vocab,
                token
            )
        ) {
            break;
        }

        const char *piece =
            llama_vocab_get_text(
                vocab,
                token
            );

        if (piece != nullptr) {
            result += piece;
        }

        llama_sampler_accept(
            sampler,
            token
        );

        /*
         * Feed the generated token back
         * into the model for the next token.
         */
        llama_batch next =
            llama_batch_init(
                1,
                0,
                1
            );

        if (next.token == nullptr) {
            break;
        }

        next.token[0] = token;

        next.pos[0] =
            n_tokens + i;

        next.n_seq_id[0] = 1;

        next.seq_id[0][0] = 0;

        next.logits[0] = true;

        next.n_tokens = 1;

        const int next_result =
            llama_decode(
                g_ctx,
                next
            );

        llama_batch_free(next);

        if (next_result != 0) {
            break;
        }
    }

    llama_sampler_free(
        sampler
    );

    return env->NewStringUTF(
        result.c_str()
    );
}
