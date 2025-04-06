import * as vscode from 'vscode';



class CursorPaddingClass{
	selections : readonly vscode.Selection[] = vscode.window.activeTextEditor!.selections;
	anchor : vscode.Selection;
	posHierarchy : number[][] = [[],[]];

	constructor(anchor : vscode.Selection){
		
		this.anchor = anchor;


	}

	orderHierarchy() : number[][]{

		for(let n = 0; n < this.selections.length; n++){
			if(this.selections[n].end.line > this.anchor.end.line) {
				
				this.posHierarchy[1].push(this.selections[n].end.line);
				continue;
			} 
			
			if(this.selections[n].end.line  < this.anchor.end.line){
	
				this.posHierarchy[0].push(this.selections[n].end.line);
				continue;
			}
		}

		this.posHierarchy[0].sort((a,b)=>{return b-a;});
		this.posHierarchy[1].sort((a,b)=>{return a-b;});

		

		return this.posHierarchy;
	}

	anchorTransform(){

		/**
		 * TODO: use vscode.window.activeTextEditor!.options.lineNumber = 2 to signify where the new anchor will be, to do so you must create a way to make it so the anchor will be the new active selection so the linenumber will be according.
		 * TODO: You might can do that by changing the order of selections in the array vscode.window.activeTextEditor!.selections or something to do with active selections.
		 */

		/**
		 * * Planning to use the webview or custom editor api for this job and more to come.
		 * 
		 * 
		 */




		

	}

	padding() : vscode.Selection[]{ 

		const newSelections: vscode.Selection[] = [];
		
		for(let i = 0; i < this.selections.length; i++){

			if(this.selections[i].end.line > this.anchor.end.line){
				
				let indexAddend: number = this.posHierarchy[1].indexOf(this.selections[i].end.line)+1;

				const newPosition: {start:vscode.Position, end: vscode.Position} = {
					start: new vscode.Position(this.selections[i].start.line + indexAddend, this.selections[i].start.character),
					end: new vscode.Position(this.selections[i].end.line + indexAddend, this.selections[i].end.character)

				};

				const newSelection: vscode.Selection = new vscode.Selection(newPosition.start,newPosition.end);
				newSelections.push(newSelection);

				continue;
			}

			if(this.selections[i].end.line < this.anchor.end.line){

				let indexAddend: number = this.posHierarchy[0].indexOf(this.selections[i].end.line)+1;

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



export function activate(context: vscode.ExtensionContext) {

	vscode.window.showInformationMessage('Activated');

	const disposablePadding = vscode.commands.registerCommand('multicursorex.cursor', ()=>{	
		
		let selections = vscode.window.activeTextEditor!.selections;

		const anchor : vscode.Selection = selections[selections.length-1];
		
		const foo = new CursorPaddingClass(anchor);
	
		foo.orderHierarchy();
	
		foo.padding();

		vscode.window.activeTextEditor!.options.lineNumbers = 2;


	});


	context.subscriptions.push(disposablePadding);   
	

	const disposableFoo = vscode.commands.registerCommand('multicursorex.hello', ()=>{
		let Position = new vscode.Position(15,0);

		let selection = new vscode.Selection(Position,Position);

		vscode.window.activeTextEditor!.selection = selection;
	});

	context.subscriptions.push(disposableFoo);


}

export function deactivate() {}

