import unittest, json, gateway

class GatewayTests(unittest.TestCase):
    def test_fallback_order(self):
        calls=[]; oldb,oldt=gateway.build_chain,gateway.try_provider
        ps=[gateway.Provider('a','http://a','a','x','openai',10),gateway.Provider('b','http://b','b','x','openai',20)]
        gateway.build_chain=lambda task="chat":ps
        def tp(p,m,o):
            calls.append(p.name); return {'choices':[{'message':{'content':'ok'}}]} if p.name=='b' else None
        gateway.try_provider=tp
        try:
            r=gateway.route([{'role':'user','content':'hi'}],{}); self.assertEqual(calls,['a','b']); self.assertEqual(r['_gateway']['provider'],'b')
        finally: gateway.build_chain, gateway.try_provider=oldb,oldt

    def test_vision_skips_text_only(self):
        oldb,oldt=gateway.build_chain,gateway.try_provider
        ps=[gateway.Provider('text','http://a','a','x','openai',10,{'chat'}),gateway.Provider('vision','http://b','b','x','openai',20,{'chat','vision'})]
        calls=[]; gateway.build_chain=lambda task="chat":ps; gateway.try_provider=lambda p,m,o:(calls.append(p.name) or {'choices':[{'message':{'content':'ok'}}]})
        try: gateway.route([{'role':'user','content':[{'type':'image_url','image_url':{'url':'data:image/png;base64,x'}}]}],{}); self.assertEqual(calls,['vision'])
        finally: gateway.build_chain, gateway.try_provider=oldb,oldt

    def test_dialect_prompt(self):
        m=gateway.make_messages({'message':'hello','dialect':'Baghdadi Arabic','personaName':'Ali'},'chat'); self.assertIn('Baghdadi Arabic',m[0]['content']); self.assertIn('fluent natural spoken language',m[0]['content'])

    def test_speaking_task_prefers_smallest_local_model(self):
        # build_chain(task) itself is exercised directly here (rather than
        # mocked out, as the other tests do for route()), since this test is
        # specifically about build_chain's own task-aware re-ranking.
        oldo=gateway.ollama_models
        big=gateway.Provider('ollama:big','http://l/v1','big','','ollama',10,{'chat'},{'size':8_000_000_000})
        small=gateway.Provider('ollama:small','http://l/v1','small','','ollama',10,{'chat'},{'size':900_000_000})
        gateway.ollama_models=lambda:[big,small]
        try:
            chain=gateway.build_chain('speaking')
            self.assertEqual(chain[0].model,'small')
        finally: gateway.ollama_models=oldo

    def test_chat_task_keeps_default_preference_order(self):
        oldo,oldp=gateway.ollama_models,gateway.PREFERRED
        big=gateway.Provider('ollama:big','http://l/v1','big','','ollama',10,{'chat'},{'size':8_000_000_000})
        small=gateway.Provider('ollama:small','http://l/v1','small','','ollama',10,{'chat'},{'size':900_000_000})
        # ollama_models() itself (not build_chain) is what applies the
        # preference-name ranking, so mock it pre-sorted the way it would
        # actually return given PREFERRED=['big'], and confirm build_chain
        # does NOT override that for a normal "chat" task.
        gateway.PREFERRED=['big']
        gateway.ollama_models=lambda:[big,small]
        try:
            chain=gateway.build_chain('chat')
            self.assertEqual(chain[0].model,'big')
        finally: gateway.ollama_models, gateway.PREFERRED=oldo,oldp

    def test_route_stream_yields_deltas_and_final_done(self):
        oldb,olds=gateway.build_chain,gateway.http_stream_lines
        p=gateway.Provider('a','http://a','a','x','openai',10,{'chat'})
        gateway.build_chain=lambda task='chat':[p]
        gateway.http_stream_lines=lambda *a,**k:iter([
            'data: '+json.dumps({'choices':[{'delta':{'content':'Hel'}}]}),
            'data: '+json.dumps({'choices':[{'delta':{'content':'lo!'}}]}),
            'data: [DONE]',
        ])
        try:
            chunks=list(gateway.route_stream([{'role':'user','content':'hi'}],{}))
            self.assertEqual(''.join(c['delta'] for c in chunks),'Hello!')
            self.assertTrue(chunks[-1]['done'])
        finally: gateway.build_chain, gateway.http_stream_lines=oldb,olds

    def test_route_stream_falls_back_when_first_provider_stream_is_empty(self):
        oldb,olds=gateway.build_chain,gateway.http_stream_lines
        empty_provider=gateway.Provider('empty','http://a','a','x','openai',10,{'chat'})
        good_provider=gateway.Provider('good','http://b','b','x','openai',20,{'chat'})
        gateway.build_chain=lambda task='chat':[empty_provider,good_provider]
        def fake_stream(method,url,*a,**k):
            if 'http://a' in url: return iter([])  # connects, never sends a data: line
            return iter(['data: '+json.dumps({'choices':[{'delta':{'content':'from good'}}]}),'data: [DONE]'])
        gateway.http_stream_lines=fake_stream
        try:
            chunks=list(gateway.route_stream([{'role':'user','content':'hi'}],{}))
            self.assertEqual(''.join(c['delta'] for c in chunks),'from good')
            self.assertEqual(chunks[0]['provider'],'good')
        finally: gateway.build_chain, gateway.http_stream_lines=oldb,olds

if __name__=='__main__': unittest.main()
