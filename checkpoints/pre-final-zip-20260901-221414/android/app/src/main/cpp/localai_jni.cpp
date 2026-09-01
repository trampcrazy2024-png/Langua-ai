#include <jni.h>
#include <string>
#include <vector>
#include <cstring>
#include <atomic>

#include "llama.h"

static llama_model *g_model = nullptr;
static llama_context *g_ctx = nullptr;

/*
 * Phase 8-D review fix #4 (cancellation):
 * checked once per generated token in nativeGenerateStream(). Set
 * by nativeCancelGeneration(), which can be called from any thread
 * (it will typically be called from the UI thread reacting to a
 * Cancel button, while generation itself runs on aiExecutor).
 */
static std::atomic<bool> g_cancel_requested{false};

/*
 * Status codes returned by nativeGenerateStream(), mirrored as
 * int constants on the Java side (LocalAIPlugin.STATUS_*). Kept as
 * plain ints (not a Java enum) to keep the JNI boundary simple.
 */
static constexpr jint STATUS_DONE = 0;
static constexpr jint STATUS_ERROR = 1;
static constexpr jint STATUS_CANCELLED = 2;

/*
 * IMPORTANT FIX:
 * llama_vocab_get_text() returns the RAW vocabulary entry
 * (internal BPE/SentencePiece form, e.g. with a leading
 * "\xe2\x96\x81" marker instead of a real space, and no
 * UTF-8 byte-fallback handling). Using it directly to build
 * the reply produces garbled / irrelevant-looking text even
 * when sampling itself is correct.
 *
 * llama_token_to_piece() is the correct API: it returns the
 * human-readable UTF-8 piece exactly as llama.cpp's own CLI
 * and server use to build output text.
 */
static std::string token_to_piece(
    const llama_vocab *vocab,
    llama_token token) {

    char buf[128];

    int32_t n = llama_token_to_piece(
        vocab,
        token,
        buf,
        sizeof(buf),
        0,
        true
    );

    if (n < 0) {
        std::vector<char> resized(
            static_cast<size_t>(-n)
        );

        n = llama_token_to_piece(
            vocab,
            token,
            resized.data(),
            static_cast<int32_t>(resized.size()),
            0,
            true
        );

        if (n < 0) {
            return std::string();
        }

        return std::string(resized.data(), static_cast<size_t>(n));
    }

    return std::string(buf, static_cast<size_t>(n));
}

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
     * 32 was only for the very first smoke test and produced
     * replies that got cut off mid-thought, which read as
     * "irrelevant". A normal short reply needs more room.
     */
    const int max_new_tokens = 256;

    llama_batch next_batch =
        llama_batch_init(1, 0, 1);

    if (next_batch.token == nullptr) {
        llama_sampler_free(sampler);
        return env->NewStringUTF("");
    }

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

        result += token_to_piece(vocab, token);

        llama_sampler_accept(
            sampler,
            token
        );

        /*
         * Feed the generated token back into the model for
         * the next token. Reuse a single-token batch across
         * the whole loop instead of alloc/free every step -
         * this was a big part of the ~2 minute latency.
         */
        next_batch.token[0] = token;
        next_batch.pos[0] = n_tokens + i;
        next_batch.n_seq_id[0] = 1;
        next_batch.seq_id[0][0] = 0;
        next_batch.logits[0] = true;
        next_batch.n_tokens = 1;

        const int next_result =
            llama_decode(
                g_ctx,
                next_batch
            );

        if (next_result != 0) {
            break;
        }
    }

    llama_batch_free(next_batch);

    llama_sampler_free(
        sampler
    );

    return env->NewStringUTF(
        result.c_str()
    );
}

/*
 * ---------------------------------------------------------------
 * Streaming variant (Phase 8-D).
 *
 * Same pipeline as nativeGenerate(), but instead of building up
 * the whole reply in memory and returning it at the end, it calls
 * back into Java once per generated piece via:
 *
 *     public void onNativeToken(String piece)
 *
 * on the plugin instance (`thiz`). The Java side is responsible
 * for accumulating the full text and for forwarding each piece to
 * JS as a Capacitor event (see LocalAIPlugin.streamChat()).
 *
 * This function itself does no threading - it must be called from
 * a background thread on the Java side (never the UI thread),
 * since llama_decode() is synchronous/blocking.
 * ---------------------------------------------------------------
 */
extern "C"
JNIEXPORT void JNICALL
Java_com_lingua_assistant_plugins_LocalAIPlugin_nativeCancelGeneration(
    JNIEnv *,
    jobject) {

    g_cancel_requested.store(true);
}

extern "C"
JNIEXPORT jint JNICALL
Java_com_lingua_assistant_plugins_LocalAIPlugin_nativeGenerateStream(
    JNIEnv *env,
    jobject thiz,
    jstring prompt) {

    g_cancel_requested.store(false);

    if (
        g_model == nullptr ||
        g_ctx == nullptr ||
        prompt == nullptr
    ) {
        return STATUS_ERROR;
    }

    jclass plugin_class = env->GetObjectClass(thiz);

    jmethodID on_token_method =
        plugin_class != nullptr
            ? env->GetMethodID(
                  plugin_class,
                  "onNativeToken",
                  "(Ljava/lang/String;)V"
              )
            : nullptr;

    /*
     * A pending exception from a failed GetMethodID lookup must be
     * cleared before we can safely keep using the JNIEnv.
     */
    if (env->ExceptionCheck()) {
        env->ExceptionClear();
        on_token_method = nullptr;
    }

    const char *prompt_text =
        env->GetStringUTFChars(prompt, nullptr);

    if (prompt_text == nullptr) {
        return STATUS_ERROR;
    }

    const llama_vocab *vocab =
        llama_model_get_vocab(g_model);

    if (vocab == nullptr) {
        env->ReleaseStringUTFChars(prompt, prompt_text);
        return STATUS_ERROR;
    }

    llama_memory_t memory = llama_get_memory(g_ctx);

    if (memory != nullptr) {
        llama_memory_clear(memory, false);
    }

    const char *chat_template =
        llama_model_chat_template(g_model, nullptr);

    if (chat_template == nullptr) {
        env->ReleaseStringUTFChars(prompt, prompt_text);
        return STATUS_ERROR;
    }

    llama_chat_message message;
    message.role = "user";

    /*
     * Qwen3 mitigation, still a stopgap (see review note): asks the
     * model to skip its internal <think> phase. Should become a
     * real GenerationOptions.thinking flag once the Conversation
     * Engine (Phase 9) owns prompt construction.
     */
    std::string prompt_with_switch =
        std::string(prompt_text) + " /no_think";

    message.content = prompt_with_switch.c_str();

    int32_t formatted_size =
        llama_chat_apply_template(
            chat_template, &message, 1, true, nullptr, 0
        );

    if (formatted_size <= 0) {
        env->ReleaseStringUTFChars(prompt, prompt_text);
        return STATUS_ERROR;
    }

    std::vector<char> formatted_prompt(
        static_cast<size_t>(formatted_size) + 1
    );

    formatted_size =
        llama_chat_apply_template(
            chat_template,
            &message,
            1,
            true,
            formatted_prompt.data(),
            static_cast<int32_t>(formatted_prompt.size())
        );

    env->ReleaseStringUTFChars(prompt, prompt_text);

    if (formatted_size <= 0) {
        return STATUS_ERROR;
    }

    formatted_prompt[static_cast<size_t>(formatted_size)] = '\0';

    std::vector<llama_token> tokens(2048);

    int32_t n_tokens =
        llama_tokenize(
            vocab,
            formatted_prompt.data(),
            formatted_size,
            tokens.data(),
            static_cast<int32_t>(tokens.size()),
            true,
            true
        );

    if (n_tokens < 0) {
        const int32_t required = -n_tokens;

        tokens.resize(static_cast<size_t>(required));

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
        return STATUS_ERROR;
    }

    tokens.resize(static_cast<size_t>(n_tokens));

    llama_batch batch =
        llama_batch_init(n_tokens + 1, 0, 1);

    if (batch.token == nullptr) {
        return STATUS_ERROR;
    }

    for (int32_t i = 0; i < n_tokens; ++i) {
        batch.token[i] = tokens[static_cast<size_t>(i)];
        batch.pos[i] = i;
        batch.n_seq_id[i] = 1;
        batch.seq_id[i][0] = 0;
        batch.logits[i] = (i == n_tokens - 1);
    }

    batch.n_tokens = n_tokens;

    const int decode_result = llama_decode(g_ctx, batch);

    llama_batch_free(batch);

    if (decode_result != 0) {
        return STATUS_ERROR;
    }

    llama_sampler *sampler = llama_sampler_init_greedy();

    if (sampler == nullptr) {
        return STATUS_ERROR;
    }

    const int max_new_tokens = 256;

    llama_batch next_batch = llama_batch_init(1, 0, 1);

    if (next_batch.token == nullptr) {
        llama_sampler_free(sampler);
        return STATUS_ERROR;
    }

    jint status = STATUS_DONE;

    for (int i = 0; i < max_new_tokens; ++i) {

        if (g_cancel_requested.load()) {
            status = STATUS_CANCELLED;
            break;
        }

        const llama_token token =
            llama_sampler_sample(sampler, g_ctx, -1);

        if (llama_vocab_is_eog(vocab, token)) {
            break;
        }

        std::string piece = token_to_piece(vocab, token);

        if (
            on_token_method != nullptr &&
            !piece.empty()
        ) {
            jstring jpiece = env->NewStringUTF(piece.c_str());

            env->CallVoidMethod(thiz, on_token_method, jpiece);

            env->DeleteLocalRef(jpiece);

            /*
             * If the Java callback threw, stop generating instead
             * of continuing to call into a JNIEnv with a pending
             * exception (that's undefined behaviour).
             */
            if (env->ExceptionCheck()) {
                env->ExceptionClear();
                status = STATUS_ERROR;
                break;
            }
        }

        llama_sampler_accept(sampler, token);

        next_batch.token[0] = token;
        next_batch.pos[0] = n_tokens + i;
        next_batch.n_seq_id[0] = 1;
        next_batch.seq_id[0][0] = 0;
        next_batch.logits[0] = true;
        next_batch.n_tokens = 1;

        const int next_result = llama_decode(g_ctx, next_batch);

        if (next_result != 0) {
            status = STATUS_ERROR;
            break;
        }
    }

    llama_batch_free(next_batch);
    llama_sampler_free(sampler);

    return status;
}
