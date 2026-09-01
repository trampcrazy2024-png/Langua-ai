#!/usr/bin/env python3
"""Model-agnostic local-first AI gateway for Lingua Assistant.

Routing is capability based, not model-name based. Local Ollama models are
 discovered automatically; any OpenAI-compatible provider can be added via
 PROVIDERS_JSON. Cloud providers are optional fallbacks.
"""
from __future__ import annotations
import json, os, sys, time, threading, urllib.error, urllib.request
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional

HOST=os.getenv("GATEWAY_HOST","0.0.0.0"); PORT=int(os.getenv("GATEWAY_PORT","8080"))
TIMEOUT=float(os.getenv("GATEWAY_TIMEOUT","45")); COOLDOWN=float(os.getenv("PROVIDER_COOLDOWN","20"))
LOCAL=os.getenv("OLLAMA_BASE_URL","http://localhost:11434").rstrip("/")
PREFERRED=[x.strip() for x in os.getenv("OLLAMA_MODEL_PREFERENCE","qwen3:4b,qwen3-4b").split(",") if x.strip()]

@dataclass
class Provider:
    name:str; base_url:str; model:str; api_key:str=""; kind:str="openai"; priority:int=100
    capabilities:set[str]=field(default_factory=lambda:{"chat"}); metadata:dict[str,Any]=field(default_factory=dict)
    failed_until:float=0.0
    def configured(self): return self.kind=="ollama" or bool(self.api_key)
    def available(self): return self.configured() and time.time() >= self.failed_until
    def describe(self):
        return {"name":self.name,"model":self.model,"kind":self.kind,"configured":self.configured(),
                "available":self.available(),"capabilities":sorted(self.capabilities),"latency_hint_ms":self.metadata.get("latency_hint_ms")}

_cache_lock=threading.Lock(); _ollama_cache:tuple[float,list[Provider]]=(0,[])

def http_json(method,url,payload=None,headers=None,timeout=TIMEOUT):
    data=json.dumps(payload).encode() if payload is not None else None
    h={"Accept":"application/json"}; h.update(headers or {})
    if payload is not None: h["Content-Type"]="application/json"
    req=urllib.request.Request(url,data=data,headers=h,method=method)
    with urllib.request.urlopen(req,timeout=timeout) as r:
        raw=r.read().decode(); return json.loads(raw) if raw else {}

def http_stream_lines(method,url,payload=None,headers=None,timeout=TIMEOUT):
    """Like http_json but for an SSE upstream: yields decoded, stripped
    lines as they arrive instead of reading the whole body at once."""
    data=json.dumps(payload).encode() if payload is not None else None
    h={"Accept":"text/event-stream"}; h.update(headers or {})
    if payload is not None: h["Content-Type"]="application/json"
    req=urllib.request.Request(url,data=data,headers=h,method=method)
    with urllib.request.urlopen(req,timeout=timeout) as r:
        for raw_line in r:
            line=raw_line.decode("utf-8",errors="ignore").strip()
            if line: yield line

def ollama_models()->list[Provider]:
    global _ollama_cache
    now=time.time()
    with _cache_lock:
        if now-_ollama_cache[0] < 10: return _ollama_cache[1]
    found=[]
    try:
        tags=http_json("GET",f"{LOCAL}/api/tags",timeout=min(TIMEOUT,8))
        for item in tags.get("models",[]):
            name=item.get("name") or item.get("model")
            if not name: continue
            caps={"chat"}; meta={"size":item.get("size"),"digest":item.get("digest")}
            # /api/show is best-effort; older Ollama versions may omit fields.
            try:
                show=http_json("POST",f"{LOCAL}/api/show",{"name":name},timeout=5)
                details=(show.get("details") or {}); families=str(details.get("families") or "")
                if "clip" in families.lower() or "vision" in str(show.get("capabilities","")).lower(): caps.add("vision")
                if "embedding" in str(show.get("capabilities","")).lower(): caps.add("embedding")
                meta.update({"parameter_size":details.get("parameter_size"),"quantization":details.get("quantization_level"),"families":families})
            except Exception: pass
            found.append(Provider("ollama:"+name,f"{LOCAL}/v1",name,"ollama","ollama",10,caps,meta))
    except Exception as e: print(f"[gateway] Ollama discovery failed: {e}",file=sys.stderr)
    # Stable preference: configured preference first, then smaller local models.
    rank={n:i for i,n in enumerate(PREFERRED)}
    found.sort(key=lambda p:(rank.get(p.model,999), p.metadata.get("size") or 10**30, p.model.lower()))
    with _cache_lock: _ollama_cache=(now,found)
    return found

def env_provider(name,base,model,key,priority,capabilities=("chat",),kind="openai"):
    return Provider(name,os.getenv(base,base).rstrip("/"),os.getenv(model,model),os.getenv(key,""),kind,priority,set(capabilities),{})

def build_chain(task="chat")->list[Provider]:
    local=ollama_models()
    # If Ollama discovery is temporarily unavailable, keep an explicit configured model as a probe.
    if not local:
        fallback_model=os.getenv("OLLAMA_MODEL",PREFERRED[0] if PREFERRED else "qwen3:4b")
        local=[Provider("ollama:"+fallback_model,f"{LOCAL}/v1",fallback_model,"ollama","ollama",10,{"chat"},{})]
    elif task=="speaking":
        # Live spoken-conversation turn: latency matters more than matching
        # OLLAMA_MODEL_PREFERENCE exactly, so prefer the smallest installed
        # model instead of ollama_models()'s default preference-first order.
        local=sorted(local,key=lambda p:(p.metadata.get("size") or 10**30, p.model.lower()))
    chain=local
    chain += [
      env_provider("deepseek", "DEEPSEEK_BASE_URL","DEEPSEEK_MODEL","DEEPSEEK_API_KEY",30),
      env_provider("minimax", "MINIMAX_BASE_URL","MINIMAX_MODEL","MINIMAX_API_KEY",40),
      env_provider("glm", "GLM_BASE_URL","GLM_MODEL","GLM_API_KEY",50),
      env_provider("kimi", "KIMI_BASE_URL","KIMI_MODEL","KIMI_API_KEY",60),
    ]
    # Fully generic OpenAI-compatible providers. Example JSON in .env.example.
    try: extra=json.loads(os.getenv("PROVIDERS_JSON","[]"))
    except json.JSONDecodeError: extra=[]
    if isinstance(extra,list):
        for i,x in enumerate(extra):
            if not isinstance(x,dict) or not x.get("base_url") or not x.get("model"): continue
            caps=set(x.get("capabilities") or ["chat"])
            chain.append(Provider(str(x.get("name") or f"custom-{i+1}"),str(x["base_url"]).rstrip("/"),str(x["model"]),str(x.get("api_key") or ""),100+i,caps,{}))
    return sorted(chain,key=lambda p:p.priority)

def needs_vision(messages):
    return any(isinstance(m.get("content"),list) and any(part.get("type")=="image_url" for part in m["content"] if isinstance(part,dict)) for m in messages)

def headers(p): return {"Authorization":"Bearer ollama"} if p.kind=="ollama" else {"Authorization":f"Bearer {p.api_key}"}
def endpoint(p): return f"{p.base_url}/chat/completions"

def try_provider(p,messages,options):
    payload={"model":p.model,"messages":messages,"temperature":options.get("temperature",.7),"top_p":options.get("top_p",.9)}
    if options.get("max_tokens"): payload["max_tokens"]=options["max_tokens"]
    try:
        result=http_json("POST",endpoint(p),payload,headers(p))
        if result.get("choices"): return result
        raise RuntimeError("empty choices")
    except Exception as e:
        p.failed_until=time.time()+COOLDOWN
        print(f"[gateway] {p.name} failed: {e}",file=sys.stderr); return None

def route(messages,options):
    vision=needs_vision(messages); errors=[]
    for p in build_chain(options.get("task","chat")):
        if not p.available(): errors.append(p.name+": unavailable"); continue
        if vision and "vision" not in p.capabilities: errors.append(p.name+": no vision"); continue
        started=time.time(); result=try_provider(p,messages,options)
        if result is not None:
            result["_gateway"]={"provider":p.name,"model":p.model,"latency_ms":int((time.time()-started)*1000),"capabilities":sorted(p.capabilities)}
            return result
        errors.append(p.name+": failed")
    raise RuntimeError("All suitable AI providers failed: "+"; ".join(errors))

def try_provider_stream(p,messages,options):
    payload={"model":p.model,"messages":messages,"temperature":options.get("temperature",.7),"top_p":options.get("top_p",.9),"stream":True}
    if options.get("max_tokens"): payload["max_tokens"]=options["max_tokens"]
    for line in http_stream_lines("POST",endpoint(p),payload,headers(p)):
        if not line.startswith("data:"): continue
        data_str=line[5:].strip()
        if data_str=="[DONE]" or not data_str: continue
        try: chunk=json.loads(data_str)
        except json.JSONDecodeError: continue
        delta=(chunk.get("choices") or [{}])[0].get("delta",{}).get("content","")
        if delta: yield delta

def route_stream(messages,options):
    """Streaming counterpart to route(): same provider selection/failover,
    but yields {"delta","done","provider","model"} chunks as they arrive
    instead of waiting for the full completion. Mirrors aiRouter.ts's
    routeChatStream() - see that file for the design rationale (commits
    to a provider once it has yielded real text; a mid-stream failure
    after that point is surfaced rather than silently retried elsewhere)."""
    vision=needs_vision(messages); errors=[]
    for p in build_chain(options.get("task","chat")):
        if not p.available(): errors.append(p.name+": unavailable"); continue
        if vision and "vision" not in p.capabilities: errors.append(p.name+": no vision"); continue
        got_any=False
        try:
            for delta in try_provider_stream(p,messages,options):
                got_any=True
                yield {"delta":delta,"done":False,"provider":p.name,"model":p.model}
        except Exception as e:
            if got_any:
                raise RuntimeError(f"{p.name} stream interrupted: {e}")
            p.failed_until=time.time()+COOLDOWN
            errors.append(f"{p.name}: failed ({e})")
            continue
        if got_any:
            yield {"delta":"","done":True,"provider":p.name,"model":p.model}
            return
        errors.append(p.name+": empty stream")
    raise RuntimeError("All suitable AI providers failed: "+"; ".join(errors))

def system_prompt(body,task):
    dialect=body.get("dialect") or body.get("targetDialect") or "the selected dialect"; persona=body.get("personaName") or "a friendly local speaker"
    return (f"You are {persona}, a {body.get('personaTrait') or 'natural and patient'} language coach. Target dialect/language: {dialect}. "
            "The learner's goal is fluent natural spoken language. Prefer short realistic spoken turns, correct only meaningful mistakes, "
            "teach colloquial vocabulary, and distinguish dialect-specific wording from formal language. Never invent what an image says.")

def make_messages(body,task):
    msgs=[{"role":"system","content":system_prompt(body,task)}]
    for t in (body.get("history") or [])[-12:]: msgs.append({"role":"assistant" if t.get("sender") in ("assistant","companion") else "user","content":str(t.get("text", ""))})
    text=str(body.get("message") or body.get("text") or body.get("prompt") or body.get("scenario") or "")
    if task=="ocr" and body.get("image"):
        msgs.append({"role":"user","content":[{"type":"text","text":"Read the attached image. If unreadable, say so. Return only factual observations."},{"type":"image_url","image_url":{"url":body["image"]}}]})
    else: msgs.append({"role":"user","content":text})
    return msgs

def extract_json(raw,fallback):
    s=(raw or "").replace("```json","").replace("```","").strip(); a=s.find("{"); b=s.rfind("}")
    if a>=0 and b>a:
        try: return json.loads(s[a:b+1])
        except json.JSONDecodeError: pass
    try: return json.loads(s)
    except Exception: return fallback

def task_response(body,task):
    prompts={
      "report":"Analyze the transcript. Return strict JSON: objectiveAchieved boolean, summaryFa string, strengthsFa string[], improvementsFa string[], newVocabulary array of {phrase,meaningFa}. All prose Persian.",
      "translate":"Translate for natural spoken use. Return strict JSON: translation, alternatives, notes. Explanations Persian.",
      "phrases":"Generate 5 useful spoken phrases. Return strict JSON: phrases array of {target,meaningFa,pronunciation,note}.",
      "quiz":"Create exactly 5 multiple-choice questions. Return strict JSON: questions array of {question,options,answerIndex,explanation}. Explanations Persian.",
      "planner":"Return strict JSON: packingItems, culturalTips, dailyRecommendations array with day,activity,localDialectChallenge. Persian.",
      "ocr":"Return strict JSON: transcription,translation,pronunciation,travelContext. Do not guess unreadable text.",
    }
    mistakes=body.get("mistakes")
    if task=="quiz" and isinstance(mistakes,list) and mistakes:
        # Quiz-into-learning-loop: target the learner's own recurring
        # mistakes (see languageMemoryStore.ts) instead of a generic
        # category/level quiz, mirroring server.ts's handleQuiz().
        prompts["quiz"]=("Create a short multiple-choice quiz that specifically targets these recurring "
                          "mistakes a language learner keeps making: "+" | ".join(str(m) for m in mistakes)+
                          ". Create exactly 3 questions, one per mistake, each testing whether the learner "
                          "now gets it right. Return strict JSON: questions array of "
                          "{question,options,answerIndex,explanation}. Explanations Persian.")
    msgs=make_messages(body,task)
    if task in prompts: msgs.insert(1,{"role":"system","content":prompts[task]})
    r=route(msgs,{"temperature":body.get("temperature",.35),"max_tokens":body.get("max_tokens",1200),"top_p":.9,"task":task})
    text=str(r.get("choices",[{}])[0].get("message",{}).get("content","")).strip()
    if not text: raise RuntimeError("empty response")
    out={"response":text,"text":text,"_gateway":r.get("_gateway")}
    if task!="chat": out.update(extract_json(text,{}))
    return out

class Handler(BaseHTTPRequestHandler):
    server_version="LinguaGateway/2.0"
    def cors(self):
        self.send_header("Access-Control-Allow-Origin","*"); self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS"); self.send_header("Access-Control-Allow-Headers","Content-Type,Authorization")
    def log_message(self,fmt,*args): print("[gateway] "+fmt%args,file=sys.stderr)
    def sendj(self,status,obj):
        b=json.dumps(obj,ensure_ascii=False).encode(); self.send_response(status); self.send_header("Content-Type","application/json"); self.send_header("Content-Length",str(len(b))); self.cors(); self.end_headers(); self.wfile.write(b)
    def read(self):
        n=int(self.headers.get("Content-Length","0") or 0)
        if n>20*1024*1024: raise ValueError("payload too large")
        return json.loads(self.rfile.read(n).decode() or "{}")
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
    def do_GET(self):
        path=self.path.split("?")[0]
        if path=="/health": self.sendj(200,{"status":"ok","service":"lingua-gateway","providers":[p.describe() for p in build_chain()]}); return
        if path=="/v1/models": self.sendj(200,{"object":"list","data":[{"id":p.model,"owned_by":p.name,"capabilities":sorted(p.capabilities)} for p in build_chain() if p.configured()]}); return
        self.sendj(404,{"error":"Not found"})
    def do_POST(self):
        path=self.path.split("?")[0]
        try: body=self.read()
        except Exception as e: self.sendj(400,{"error":str(e)}); return
        if path=="/v1/chat/completions":
            if body.get("stream"):
                try:
                    self.send_response(200)
                    self.send_header("Content-Type","text/event-stream")
                    self.send_header("Cache-Control","no-cache")
                    self.cors(); self.end_headers()
                    for chunk in route_stream(body.get("messages") or [],{"temperature":body.get("temperature",.7),"top_p":body.get("top_p",.9),"max_tokens":body.get("max_tokens"),"task":body.get("task","chat")}):
                        self.wfile.write(("data: "+json.dumps(chunk,ensure_ascii=False)+"\n\n").encode())
                        self.wfile.flush()
                except Exception as e:
                    # Headers are already sent by this point (streaming has
                    # started), so a mid-stream failure can't become a clean
                    # 503 anymore - send it as one more SSE event instead so
                    # the client at least learns why the stream stopped.
                    try:
                        self.wfile.write(("data: "+json.dumps({"error":str(e)},ensure_ascii=False)+"\n\n").encode())
                    except Exception: pass
                return
            try: self.sendj(200,route(body.get("messages") or [],{"temperature":body.get("temperature",.7),"top_p":body.get("top_p",.9),"max_tokens":body.get("max_tokens"),"task":body.get("task","chat")}))
            except Exception as e: self.sendj(503,{"error":str(e)})
            return
        tasks={"/api/chat":"chat", "/chat":"chat", "/api/scenario-report":"report", "/api/translate":"translate", "/api/generate-phrases":"phrases", "/api/daily-phrases":"phrases", "/api/planner":"planner", "/api/ocr":"ocr", "/api/quiz":"quiz"}
        if path in tasks:
            # /api/chat additionally honors an explicit body.task of "chat" or
            # "speaking" (server.ts always sends this) for the same latency
            # vs. quality routing distinction build_chain() makes above, when
            # the gateway's own standalone /api/chat is used directly instead
            # of going through server.ts.
            task=body.get("task") if path in ("/api/chat","/chat") and body.get("task") in ("chat","speaking") else tasks[path]
            try: self.sendj(200,task_response(body,task))
            except Exception as e: self.sendj(503,{"error":str(e)})
            return
        self.sendj(404,{"error":"Not found"})

def main():
    print(f"[gateway] Smart Router 2.0 listening on {HOST}:{PORT}")
    print("[gateway] Local models are discovered from Ollama; routing is capability based.")
    for p in build_chain(): print(f"[gateway] {p.name}: {p.model} {'READY' if p.configured() else 'not configured'} {sorted(p.capabilities)}")
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
if __name__=="__main__": main()
