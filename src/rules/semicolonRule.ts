/**
 * @license
 * Copyright 2013 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as ts from "typescript";
import * as Lint from "../lint";

const OPTION_ALWAYS = "always";
const OPTION_NEVER = "never";

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING_MISSING = "missing semicolon";
    public static FAILURE_STRING_UNNECESSARY = "unnecessary semicolon";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new SemicolonWalker(sourceFile, this.getOptions()));
    }
}

class SemicolonWalker extends Lint.RuleWalker {
    public visitVariableStatement(node: ts.VariableStatement) {
        this.checkSemicolonAt(node);
        super.visitVariableStatement(node);
    }

    public visitExpressionStatement(node: ts.ExpressionStatement) {
        this.checkSemicolonAt(node);
        super.visitExpressionStatement(node);
    }

    public visitReturnStatement(node: ts.ReturnStatement) {
        this.checkSemicolonAt(node);
        super.visitReturnStatement(node);
    }

    public visitBreakStatement(node: ts.BreakOrContinueStatement) {
        this.checkSemicolonAt(node);
        super.visitBreakStatement(node);
    }

    public visitContinueStatement(node: ts.BreakOrContinueStatement) {
        this.checkSemicolonAt(node);
        super.visitContinueStatement(node);
    }

    public visitThrowStatement(node: ts.ThrowStatement) {
        this.checkSemicolonAt(node);
        super.visitThrowStatement(node);
    }

    public visitImportDeclaration(node: ts.ImportDeclaration) {
        this.checkSemicolonAt(node);
        super.visitImportDeclaration(node);
    }

    public visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration) {
        this.checkSemicolonAt(node);
        super.visitImportEqualsDeclaration(node);
    }

    public visitDoStatement(node: ts.DoStatement) {
        this.checkSemicolonAt(node);
        super.visitDoStatement(node);
    }

    public visitDebuggerStatement(node: ts.Statement) {
        this.checkSemicolonAt(node);
        super.visitDebuggerStatement(node);
    }

    public visitPropertyDeclaration(node: ts.PropertyDeclaration) {
        const initializer = node.initializer;
        /* ALWAYS === "enabled" for this rule. */
        if (this.hasOption(OPTION_NEVER) || !(initializer && initializer.kind === ts.SyntaxKind.ArrowFunction)) {
            this.checkSemicolonAt(node);
        }
        super.visitPropertyDeclaration(node);
    }

    public visitInterfaceDeclaration(node: ts.InterfaceDeclaration) {
        for (let member of node.members) {
            this.checkSemicolonAt(member);
        }
        super.visitInterfaceDeclaration(node);
    }

    private checkSemicolonAt(node: ts.Node) {
        const sourceFile = this.getSourceFile();
        const children = node.getChildren(sourceFile);
        const hasSemicolon = children.some((child) => child.kind === ts.SyntaxKind.SemicolonToken);
        const position = node.getStart(sourceFile) + node.getWidth(sourceFile);
        // Backwards compatible with plain {"semicolon": true}
        const always = this.hasOption(OPTION_ALWAYS) || (this.getOptions() && this.getOptions().length === 0);

        if (always && !hasSemicolon) {
            this.addFailure(this.createFailure(Math.min(position, this.getLimit()), 0, Rule.FAILURE_STRING_MISSING));
        } else if (this.hasOption(OPTION_NEVER) && hasSemicolon) {
            const scanner = ts.createScanner(ts.ScriptTarget.ES5, false, ts.LanguageVariant.Standard, sourceFile.text);
            scanner.setTextPos(position);

            let tokenKind = scanner.scan();
            while (tokenKind === ts.SyntaxKind.WhitespaceTrivia || tokenKind === ts.SyntaxKind.NewLineTrivia) {
                tokenKind = scanner.scan();
            }

            if (tokenKind !== ts.SyntaxKind.OpenParenToken && tokenKind !== ts.SyntaxKind.OpenBracketToken
                    && tokenKind !== ts.SyntaxKind.PlusToken && tokenKind !== ts.SyntaxKind.MinusToken) {
                this.addFailure(this.createFailure(Math.min(position - 1, this.getLimit()), 1, Rule.FAILURE_STRING_UNNECESSARY));
            }
        }
    }
}
