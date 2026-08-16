#include <jni.h>
#include <string>
#include <vector>
#include <cstring>

#include "llama.h"

static llama_model *g_model = nullptr;
static llama_context *g_ctx = nullptr;

extern "C"
JNIEXPORT jboolean JNICALL
Java_com_lligua_assistant_plugins_LocalAIPlugin_nativeLoadModel(
        JNIEnv *env,
        jobject,
        jstring modelPath) {

    if (modelPath == nullptr) {
        return JNI_FALSE;
    }

    const char *path = env->GetStringUTFChars(modelPath, nullptr);

    llama_backend_init();

    llama_model_params model_params = llama_model_default_params();
    model_params.n_gpu_layers = 0;

    g_model = llama_model_load_from_file(path, model_params);

    env->ReleaseStringUTFChars(modelPath, path);

    if (g_model == nullptr) {
        return JNI_FALSE;
    }

    llama_context_params ctx_params = llama_context_default_params();

    ctx_params.n_ctx = 2048;
    ctx_params.n_batch = 512;
    ctx_params.n_ubatch = 512;
    ctx_params.n_threads = 4;
    ctx_params.n_threads_batch = 4;

    g_ctx = llama_init_from_model(g_model, ctx_params);

    if (g_ctx == nullptr) {
        llama_model_free(g_model);
        g_model = nullptr;
        return JNI_FALSE;
    }

    return JNI_TRUE;
}

extern "C"
JNIEXPORT void JNICALL
Java_com_lligua_assistant_plugins_LocalAIPlugin_nativeUnloadModel(
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
Java_com_lligua_assistant_plugins_LocalAIPlugin_nativeIsLoaded(
        JNIEnv *,
        jobject) {

    return (g_model != nullptr && g_ctx != nullptr)
        ? JNI_TRUE
        : JNI_FALSE;
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_lligua_assistant_plugins_LocalAIPlugin_nativeGenerate(
        JNIEnv *env,
        jobject,
        jstring prompt) {

    if (g_model == nullptr || g_ctx == nullptr || prompt == nullptr) {
        return env->NewStringUTF("");
    }

    const char *prompt_text =
        env->GetStringUTFChars(prompt, nullptr);

    const llama_vocab *vocab =
        llama_model_get_vocab(g_model);

    std::vector<llama_token> tokens(2048);

    int32_t n_tokens = llama_tokenize(
        vocab,
        prompt_text,
        static_cast<int32_t>(strlen(prompt_text)),
        tokens.data(),
        static_cast<int32_t>(tokens.size()),
        true,
        true
    );

    env->ReleaseStringUTFChars(prompt, prompt_text);

    if (n_tokens < 0) {
        return env->NewStringUTF("");
    }

    tokens.resize(n_tokens);

    llama_batch batch =
        llama_batch_get_one(tokens.data(), n_tokens);

    if (llama_decode(g_ctx, batch) != 0) {
        return env->NewStringUTF("");
    }

    std::string result;

    const int max_new_tokens = 128;
    const int32_t n_vocab =
        llama_vocab_n_tokens(vocab);

    for (int i = 0; i < max_new_tokens; ++i) {

        float *logits = llama_get_logits(g_ctx);

        llama_token token = 0;
        float best_logit = -1e30f;

        for (int32_t j = 0; j < n_vocab; ++j) {
            if (logits[j] > best_logit) {
                best_logit = logits[j];
                token = j;
            }
        }

        if (llama_vocab_is_eog(vocab, token)) {
            break;
        }

        const char *piece =
            llama_vocab_get_text(vocab, token);

        if (piece != nullptr) {
            result += piece;
        }

        batch = llama_batch_get_one(&token, 1);

        if (llama_decode(g_ctx, batch) != 0) {
            break;
        }
    }

    return env->NewStringUTF(result.c_str());
}
