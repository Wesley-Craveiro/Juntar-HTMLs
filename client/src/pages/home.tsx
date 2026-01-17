import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CodeMirror from "@uiw/react-codemirror";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";

const JS_SNIPPET = `// Javascript Code
function calculateFibonacci(n) {
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

const result = calculateFibonacci(10);
console.log("Result:", result);`;

const HTML_SNIPPET = `<!-- HTML Structure -->
<div class="card">
  <div class="card-header">
    <h2 class="title">Welcome</h2>
  </div>
  <div class="card-content">
    <p>This is a sample card component with clean markup.</p>
    <button class="btn-primary">Click Me</button>
  </div>
</div>`;

const PYTHON_SNIPPET = `# Python Script
def process_data(data):
    """
    Process the input data and return a clean dictionary
    """
    result = {}
    for item in data:
        if item.get('active'):
            result[item['id']] = item['value'] * 2
    return result

data = [
    {'id': 1, 'value': 100, 'active': True},
    {'id': 2, 'value': 200, 'active': False},
    {'id': 3, 'value': 300, 'active': True}
]

print(process_data(data))`;

export default function Home() {
  return (
    <div className="h-screen w-full bg-background p-4 text-foreground">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Code Columns</h1>
        <p className="text-muted-foreground">
          Code editors with syntax highlighting (Dracula theme) arranged in resizable columns.
        </p>
      </div>

      <div className="h-[calc(100vh-120px)] rounded-lg border bg-card shadow-sm">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
          <ResizablePanel defaultSize={33} minSize={20}>
            <div className="flex h-full flex-col p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="flex h-6 w-6 items-center justify-center rounded bg-[#FDC616] text-[10px] font-bold shadow-sm"
                    style={{ color: "#000000" }}
                  >
                    JS
                  </div>
                  <h3 className="font-semibold text-lg">JavaScript</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">read-only</span>
              </div>
              <div className="flex-1 overflow-hidden rounded-md border shadow-inner">
                <CodeMirror
                  value={JS_SNIPPET}
                  height="100%"
                  theme={dracula}
                  extensions={[javascript({ jsx: true })]}
                  editable={true}
                  className="h-full text-base"
                />
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={33} minSize={20}>
             <div className="flex h-full flex-col p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="flex h-6 w-6 items-center justify-center rounded bg-[#E34F26] text-[10px] font-bold text-white shadow-sm">
                    HTML
                  </div>
                  <h3 className="font-semibold text-lg">HTML</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">editable</span>
              </div>
              <div className="flex-1 overflow-hidden rounded-md border shadow-inner">
                <CodeMirror
                  value={HTML_SNIPPET}
                  height="100%"
                  theme={dracula}
                  extensions={[html()]}
                  className="h-full text-base"
                />
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={34} minSize={20}>
             <div className="flex h-full flex-col p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-[#3776AB] text-[10px] font-bold text-white shadow-sm">
                    PY
                  </div>
                  <h3 className="font-semibold text-lg">Python</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">editable</span>
              </div>
              <div className="flex-1 overflow-hidden rounded-md border shadow-inner">
                <CodeMirror
                  value={PYTHON_SNIPPET}
                  height="100%"
                  theme={dracula}
                  extensions={[python()]}
                  className="h-full text-base"
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
