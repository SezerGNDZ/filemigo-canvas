"""python examples/count-agent-tokens.py payloads.json [report.json]
Requires tiktoken only for this benchmark, never for the application.
Counts minified payload text, not billing or model task success.
"""
import json
import sys
import tiktoken
from pathlib import Path

source = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
report = {k: v for k, v in source.items() if k != 'payloads'}
report['tiktokenVersion'] = tiktoken.__version__
report['counts'] = {}
for encoding in ['o200k_base', 'cl100k_base']:
    codec = tiktoken.get_encoding(encoding)
    report['counts'][encoding] = {k: len(codec.encode(v, disallowed_special=())) for k, v in source['payloads'].items()}
report['method'] = 'Exact tokens in minified JSON payloads; includes response envelopes. Full/agent tools are tools/list responses from 0.6. Contract is a one-time extra cost. Views omit rendering/decorations and are not equivalent editable exports. No model reasoning, transport wrappers, provider billing or task-success measurements.'
result = json.dumps(report, ensure_ascii=False, indent=2)
if len(sys.argv) > 2:
    Path(sys.argv[2]).write_text(result, encoding='utf-8')
print(result)
