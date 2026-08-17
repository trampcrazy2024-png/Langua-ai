#include <jni.h>
#include <string>
#include <vector>
#include <cstring>
#include <cstdio>

#include "llama.h"

static llama_model *g_model = nullptr;
static llama_context *g_ctx = nullptr;
static bool g_backend_initialized = false;

static void cleanupModel() {
    if (g_ctx != nullptr) {
        llama_free(g_ctx);
        g_ctx = nullptr;
    }

    if (g_model != nullptr) {
        llama_model_free(g_model);
        g_model = nullptr;
    }
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

    // Never keep an old model/context while loading another one.
    cleanupModel();

    // Verify the native file path before entering llama.cpp.
    FILE *file = std::fopen(path, "rb");

    if (file == nullptr) {
        env->ReleaseStringUTFChars(modelPath, path);
        return JNI_FALSE;
    }

    std::fseek(file, 0, SEEK_END);
    const long long fileSize = std::ftell(file);
    std::fclose(file);

    if (fileSize <= 0) {
        env->ReleaseStringUTFChars(modelPath, path);
        return JNI_FALSE;
    }

    // Basic GGUF magic check.
    file = std::fopen(path, "rb");

    if (file == nullptr) {
        env->ReleaseStringUTFChars(modelPath, path);
        return JNI_FALSE;
    }

    char magic[4] = {0, 0, 0, 0};
    const size_t magicRead =
        std::fread(magic, 1, sizeof(magic), file);

    std::fclose(file);

    if (magicRead != sizeof(magic)
            || magic[0] != 'G'
            || magic[1] != 'G'
            || magic[2] != 'U'
            || magic[3] != 'F') {

        env->ReleaseStringUTFChars(modelPath, path);
        return JNI_FALSE;
    }

    if (!g_backend_initialized) {
        llama_backend_init();
        g_backend_initialized = true;
    }

    llama_model_params model_params =
        llama_model_default_params();

    // CPU-only for the first stable Android load test.
    model_params.n_gpu_layers = 0;

    g_model =
        llama_model_load_from_file(
            path,
            model_params
        );

    env->ReleaseStringUTFChars(modelPath, path);

    if (g_model == nullptr) {
        cleanupModel();
        return JNI_FALSE;
    }

    /*
     * Conservative Android context settings.
     *
     * Start small to avoid a large memory allocation during the
     * first model-load test.
     */
    llama_context_params ctx_params =
        llama_context_default_params();

    ctx_params.n_ctx = 1024;
    ctx_params.n_batch = 128;
    ctx_params.n_ubatch = 128;
    ctx_params.n_threads = 2;
    ctx_params.n_threads_batch = 2;

    g_ctx =
        llama_init_from_model(
            g_model,
            ctx_params
        );

    if (g_ctx == nullptr) {
        cleanupModel();
        return JNI_FALSE;
    }

    return JNI_TRUE;
}

extern "C"
JNIEXPORT void JNICALL
Java_com_lingua_assistant_plugins_LocalAIPlugin_nativeUnloadModel(
    JNIEnv *,
    jobject) {

    cleanupModel();

    if (g_backend_initialized) {
        llama_backend_free();
        g_backend_initialized = false;
    }
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

    /*
     * ------------------------------------------------------------
     * Reset previous conversation state.
     *
     * Each nativeGenerate() call currently represents one
     * independent chat request.
     * ------------------------------------------------------------
     */

    llama_memory_t memory = llama_get_memory(g_ctx);

    if (memory != nullptr) {
        llama_memory_clear(memory, true);
    }

    const char *prompt_text =
        env->GetStringUTFChars(prompt, nullptr);

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
     * ------------------------------------------------------------
     * Qwen3 chat template
     * ------------------------------------------------------------
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

    /*
     * Qwen3 supports /no_think.
     *
     * This is intentionally used for the first stable Android
     * generation test so a simple "Hello" does not enter a long
     * reasoning phase.
     */

    std::string user_content =
        std::string(prompt_text) +
        "\n/no_think";

    env->ReleaseStringUTFChars(
        prompt,
        prompt_text
    );

    llama_chat_message message;

    message.role = "user";
    message.content = user_content.c_str();

    /*
     * ------------------------------------------------------------
     * Apply model chat template.
     * ------------------------------------------------------------
     */

    int32_t required =
        llama_chat_apply_template(
            chat_template,
            &message,
            1,
            true,
            nullptr,
            0
        );

    if (required <= 0) {
        return env->NewStringUTF("");
    }

    std::vector<char> formatted_prompt(
        static_cast<size_t>(required) + 1
    );

    int32_t formatted_size =
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

    if (formatted_size <= 0) {
        return env->NewStringUTF("");
    }

    formatted_prompt[formatted_size] = '\0';

    /*
     * ------------------------------------------------------------
     * Tokenize
     * ------------------------------------------------------------
     */

    std::vector<llama_token> tokens(
        4096
    );

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

    if (n_tokens < 0) {
        return env->NewStringUTF("");
    }

    tokens.resize(n_tokens);

    if (tokens.empty()) {
        return env->NewStringUTF("");
    }

    /*
     * ------------------------------------------------------------
     * Build the PROMPT batch manually.
     *
     * This is important:
     *
     * llama_batch_get_one() sets pos = nullptr.
     *
     * For generation we need explicit positions and sequence IDs.
     * ------------------------------------------------------------
     */

    llama_batch prompt_batch =
        llama_batch_init(
            static_cast<int32_t>(
                tokens.size()
            ),
            0,
            1
        );

    if (
        prompt_batch.token == nullptr ||
        prompt_batch.pos == nullptr ||
        prompt_batch.n_seq_id == nullptr ||
        prompt_batch.seq_id == nullptr ||
        prompt_batch.logits == nullptr
    ) {
        llama_batch_free(prompt_batch);
        return env->NewStringUTF("");
    }

    prompt_batch.n_tokens =
        static_cast<int32_t>(
            tokens.size()
        );

    for (
        int32_t i = 0;
        i < prompt_batch.n_tokens;
        ++i
    ) {
        prompt_batch.token[i] = tokens[i];

        prompt_batch.pos[i] = i;

        prompt_batch.n_seq_id[i] = 1;

        prompt_batch.seq_id[i][0] = 0;

        /*
         * Only the final prompt token needs logits because
         * generation samples from the final position.
         */
        prompt_batch.logits[i] =
            (i == prompt_batch.n_tokens - 1)
                ? 1
                : 0;
    }

    /*
     * ------------------------------------------------------------
     * Decode PROMPT
     * ------------------------------------------------------------
     */

    if (
        llama_decode(
            g_ctx,
            prompt_batch
        ) != 0
    ) {
        llama_batch_free(prompt_batch);
        return env->NewStringUTF("");
    }

    llama_batch_free(prompt_batch);

    /*
     * ------------------------------------------------------------
     * Sampler
     *
     * Start with greedy sampling for the first stable
     * generation test.
     * ------------------------------------------------------------
     */

    llama_sampler *sampler =
        llama_sampler_init_greedy();

    if (sampler == nullptr) {
        return env->NewStringUTF("");
    }

    /*
     * ------------------------------------------------------------
     * Generate
     * ------------------------------------------------------------
     */

    std::string result;

    const int max_new_tokens = 32;

    int32_t current_pos =
        static_cast<int32_t>(
            tokens.size()
        );

    for (
        int i = 0;
        i < max_new_tokens;
        ++i
    ) {
        /*
         * Sample from the final decoded position.
         */
        llama_token token =
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

        llama_sampler_accept(
            sampler,
            token
        );

        /*
         * Convert token to text.
         */
        const char *piece =
            llama_vocab_get_text(
                vocab,
                token
            );

        if (piece != nullptr) {
            result += piece;
        }

        /*
         * --------------------------------------------------------
         * Decode the generated token.
         *
         * IMPORTANT:
         * Position must increase for every generated token.
         * --------------------------------------------------------
         */

        llama_batch next_batch =
            llama_batch_init(
                1,
                0,
                1
            );

        if (
            next_batch.token == nullptr ||
            next_batch.pos == nullptr ||
            next_batch.n_seq_id == nullptr ||
            next_batch.seq_id == nullptr ||
            next_batch.logits == nullptr
        ) {
            llama_batch_free(next_batch);
            break;
        }

        next_batch.n_tokens = 1;

        next_batch.token[0] = token;

        next_batch.pos[0] = current_pos;

        next_batch.n_seq_id[0] = 1;

        next_batch.seq_id[0][0] = 0;

        next_batch.logits[0] = 1;

        if (
            llama_decode(
                g_ctx,
                next_batch
            ) != 0
        ) {
            llama_batch_free(next_batch);
            break;
        }

        llama_batch_free(next_batch);

        current_pos++;
    }

    llama_sampler_free(
        sampler
    );

    /*
     * ------------------------------------------------------------
     * Return generated text.
     * ------------------------------------------------------------
     */

    return env->NewStringUTF(
        result.c_str()
    );
}
