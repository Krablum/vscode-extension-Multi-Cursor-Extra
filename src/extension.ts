import { promises } from 'dns';
import path, { dirname } from 'path';
import * as vscode from 'vscode';



class CursorPaddingClass{
	selections : readonly vscode.Selection[] = vscode.window.activeTextEditor!.selections;
	anchor : vscode.Selection;
	positionOrder : number[][] = [[],[]];

	filePath : string;
	options: vscode.DecorationRenderOptions;
	decoration: vscode.TextEditorDecorationType;

	constructor(anchor : vscode.Selection, filePath : string){
		
		this.anchor = anchor;
		this.filePath = filePath;
		this.options = {

			gutterIconPath : vscode.Uri.file(filePath),
			gutterIconSize : "100%"

		};
		this.decoration = vscode.window.createTextEditorDecorationType(this.options);

	};
	




	anchorTransform(){

		/**
		 * TODO: use vscode.window.activeTextEditor!.options.lineNumber = 2 to signify where the new anchor will be, to do so you must create a way to make it so the anchor will be the new active selection so the linenumber will be according.
		 * TODO: You might can do that by changing the order of selections in the array vscode.window.activeTextEditor!.selections or something to do with active selections.
		 */

		/**
		 * * Using TextEditorDecorationType from the vscode extension api.
		 * * Use contenticonpath and put the range where the anchor to give an icon for where padding originates
		 * 
		 */
		
		const range = new vscode.Range(this.anchor.end, this.anchor.end);

		vscode.window.activeTextEditor!.setDecorations(this.decoration, [range]);
		
		vscode.workspace.onDidChangeTextDocument(()=>{
			vscode.window.activeTextEditor!.setDecorations(this.decoration, [range]);
		});
	}

	order() : number[][]{

		for(let n = 0; n < this.selections.length; n++){
			if(this.selections[n].end.line > this.anchor.end.line) {
				
				this.positionOrder[1].push(this.selections[n].end.line);
				continue;
			} 
			
			if(this.selections[n].end.line  < this.anchor.end.line){
	
				this.positionOrder[0].push(this.selections[n].end.line);
				continue;
			}
		}

		this.positionOrder[0].sort((a,b)=>{return b-a;});
		this.positionOrder[1].sort((a,b)=>{return a-b;});

		

		return this.positionOrder;
	}

	padding() : vscode.Selection[]{ 

		const newSelections: vscode.Selection[] = [];
		
		for(let i = 0; i < this.selections.length; i++){

			if(this.selections[i].end.line > this.anchor.end.line){
				
				let indexAddend: number = this.positionOrder[1].indexOf(this.selections[i].end.line)+1;

				const newPosition: {start:vscode.Position, end: vscode.Position} = {
					start: new vscode.Position(this.selections[i].start.line + indexAddend, this.selections[i].start.character),
					end: new vscode.Position(this.selections[i].end.line + indexAddend, this.selections[i].end.character)

				};

				const newSelection: vscode.Selection = new vscode.Selection(newPosition.start,newPosition.end);
				newSelections.push(newSelection);

				continue;
			}

			if(this.selections[i].end.line < this.anchor.end.line){

				let indexAddend: number = this.positionOrder[0].indexOf(this.selections[i].end.line)+1;

				const newPosition: {start:vscode.Position, end: vscode.Position} = {
					start: (()=>{ 
						
						const newStart = this.selections[i].start.line - indexAddend;

						if(newStart < 0){
							return new vscode.Position(0,0);
						}

						return new vscode.Position(this.selections[i].start.line - indexAddend, this.selections[i].start.character);

					})(),
					end: (()=>{ 
						
						const newEnd = this.selections[i].end.line - indexAddend;

						if(newEnd < 0){
							return new vscode.Position(0,0);
						}

						return new vscode.Position(this.selections[i].end.line - indexAddend, this.selections[i].start.character);

					})(),
				};

				const newSelection: vscode.Selection = new vscode.Selection(newPosition.start,newPosition.end);
				newSelections.push(newSelection);

				continue;
			}

			if(this.selections[i].end.line === this.anchor.end.line){
				newSelections.push(this.selections[i]);
				continue;
			}

		}


		vscode.window.activeTextEditor!.selections = newSelections;
		return newSelections;
	}

}


/**
 * 
 * 
 * TODO: Remember to create a class for creating disposable variables
 * 
 * 
 */

const paddingObjects : CursorPaddingClass[] = [];

const cPaddingList = {

	cPad() : (...args:any[])=>(any){

		return ()=>{
			let selections = vscode.window.activeTextEditor!.selections;
	
			const anchor : vscode.Selection = selections[selections.length-1];
			

			const path = (__dirname.split('\\'));
			path.pop(); //To take out \out

			const command = new CursorPaddingClass(anchor, path.join('\\') + '\\media\\circle.svg'); 
			paddingObjects.push(command);
			
			paddingObjects.at(-2)?.decoration.dispose();
			command.anchorTransform();
			command.order();
			command.padding();

			console.log(path.join('\\') + '\\media\\circle.svg');
		};
	},

	cAnchor(){

	}
};



export function activate(context: vscode.ExtensionContext) {

	vscode.window.showInformationMessage('Activated');

	const disposablePadding = vscode.commands.registerCommand('multicursorex.padding.pad', cPaddingList.cPad());	

	context.subscriptions.push(disposablePadding);   
	
}

export function deactivate() {}
