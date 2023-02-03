// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const template = require("@babel/template").default;
const types = require("@babel/types");
function trimAll(str: string): string {
  let reg = /\s+/g;
  let trimStr: string = "";
  if (typeof str === "string") {
    trimStr = str.replace(reg, "");
  }
  return trimStr;
}
function isChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "code2i18" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("code2i18.helloWorld", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("!!!!!!!!");
    let editor = vscode.window.activeTextEditor;
    let text = editor?.document.getText();
    const ast = parser.parse(text, {
      sourceType: "unambiguous",
      plugins: ["jsx"],
    });
    const code2i18n = (textVal: string) => {
      let tt = types.stringLiteral(trimAll(textVal));
      let newNode = template.expression(`window.t()`)();
      newNode.arguments.unshift(tt);
      newNode.isNew = true;
      return newNode;
    };
    traverse(ast, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      JSXText(path: any, state: any) {
        let textVal = path.node.value;
        if (path.node.isNew || textVal.trim() === "" || !isChinese(textVal)) {
          return;
        }
        path.replaceWith(types.jsxExpressionContainer(code2i18n(textVal)));
        path.skip();
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      StringLiteral(path: any, state: any) {
        if (path.findParent((path: any) => path.isCallExpression())) {
          //如果父级是callexpression
          if (generate(path.parent.callee).code === "window.t") {
            return;
          }
          let textVal = path.node.value;
          if (path.node.isNew || textVal.trim() === "" || !isChinese(textVal)) {
            return;
          }
          path.replaceWith(code2i18n(textVal));
          path.skip();
        }
      },
    });

    const { code, map } = generate(ast, {
      jsescOption: { minimal: true },
    });
    console.log(code);
    // vscode.window.showInformationMessage("Hello World from code2i18! I am huang");
    if (!editor) {
      return;
    }
    // let snippet: vscode.SnippetString = new vscode.SnippetString(code);
    // editor.insertSnippet(snippet);

    // let selection = editor?.selection;
    // editor.edit((builder) => {
    //   console.log(builder);
    //   builder.replace(selection, code);
    // });
    editor.edit((editBuilder) => {
      // 从开始到结束，全量替换
      const line = vscode.window.activeTextEditor!.document.lineCount;
      const end = new vscode.Position(line + 1, 0);
      editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), code);
    });
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
