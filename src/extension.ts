import { throws } from 'assert';
import { Console, error } from 'console';
import * as vscode from 'vscode';

// Facade Design Pattern

class Origin{

	selection : vscode.Selection;
	decorationObj : Decoration;

	constructor(selection : vscode.Selection | undefined, decorationObj : Decoration){

		if(typeof(selection) === "undefined"){
			vscode.window.showErrorMessage('Error : Arg of "selection" is undefined');
			throw error;
		}

		this.selection = selection;
		this.decorationObj = decorationObj;
		
	}

	transformation = {

		up : ()=>{
			
			const arr : vscode.Selection[] = [];

			vscode.window.activeTextEditor!.selections.map((x)=>{arr.push(x);});
			arr.sort((a,b)=>{return a.anchor.line-b.anchor.line;});
			
			const index = arr.indexOf(this.selection)-1;
			const nextSelection : vscode.Selection | undefined =  arr.at(index);
			
			if(nextSelection === undefined){ throw error('Variable "nextSelection" is type of undefined');}

			this.selection = nextSelection;
		},
		
		down : ()=>{



		}
	};
	indicate(){

		const range = new vscode.Range(this.selection.end, this.selection.end);

		vscode.window.activeTextEditor!.setDecorations(this.decorationObj.decoration, [range]);
		
		vscode.workspace.onDidChangeTextDocument(()=>{
			vscode.window.activeTextEditor!.setDecorations(this.decorationObj.decoration, [range]);
		});
	
	}
}

class Decoration{

	decorationFilePath : string;
	decorationOptions: vscode.DecorationRenderOptions;
	decoration: vscode.TextEditorDecorationType;
	static decorationInstances : vscode.TextEditorDecorationType[] =[];

	constructor(filePath : string, options : object){

		this.decorationFilePath = filePath;
		this.decorationOptions = options;
		this.decoration = vscode.window.createTextEditorDecorationType(this.decorationOptions);

	}

}



class Padding{

	origin : vscode.Selection;

	selections : readonly vscode.Selection[] =  vscode.window.activeTextEditor!.selections; 

	constructor(selection : vscode.Selection){

		this.origin = selection;

	}

	selectionSequence : {greaterThenOrigin : number[], lesserThenOrigin : number[]} = {

		greaterThenOrigin : [],
		lesserThenOrigin : []
	};

	order(){

		for(let n = 0; n < this.selections.length; n++){
			if(this.selections[n].active.line > this.origin.active.line) {
				
				this.selectionSequence.greaterThenOrigin.push(this.selections[n].active.line);
				continue;
			} 
			
			if(this.selections[n].active.line  < this.origin.active.line){

				this.selectionSequence.lesserThenOrigin.push(this.selections[n].active.line);
				continue;
			}
		}

		this.selectionSequence.lesserThenOrigin.sort((a,b)=>{return b-a;});
		this.selectionSequence.greaterThenOrigin.sort((a,b)=>{return a-b;});

		return [this.selectionSequence.lesserThenOrigin, this.selectionSequence.greaterThenOrigin];

	}

	pad(){

		this.order();
		
		const newSelections: vscode.Selection[] = [];

		//* for loop in which it iterates through all selection currently in the active editor and see whether the said selection is greater then the origin where the selection pads from
		//* after finding the greater selections the loop then takes the values of of index from selectionPositionOrder which is a 2d array which orders all the active.line value position
		//* this value is then added by 1 and is defined as indexAddend
		//* we then make new position objects in which we take the currently iterated selection then added by the indexAddend for both the start and end of a selection to change position of a selection
		//* this work as it makes a clear spacing called padding as it make a hierarchical pattern of the array for example(We have the selection ordered in position values {8,5,3,1} these values have index which follows {0,1,2,3} making it a indexAddend, add all elements by 1
		//* we now have a way to keep seperation between selections, as if we just add all selections by 1 it is the same pattern just move down. However if we add based on the index we now can keep padding) 

		
		for(let i = 0; i < this.selections.length; i++){

			if(this.selections[i].active.line > this.origin.active.line){
				
				let indexAddend: number = this.selectionSequence.greaterThenOrigin.indexOf(this.selections[i].active.line)+1;

				const anchorLine = this.selections[i].anchor.line + indexAddend;
				const activeLine = this.selections[i].active.line + indexAddend;

				const anchorChar =  this.selections[i].anchor.character;
				const activeChar =  this.selections[i].active.character;


				const newPosition: {anchor : vscode.Position, active : vscode.Position} = {

					anchor: new vscode.Position(anchorLine, anchorChar),
					active: new vscode.Position(activeLine, activeChar)

				};

				const newSelection: vscode.Selection = new vscode.Selection(newPosition.anchor,newPosition.active);
				newSelections.push(newSelection);

				continue;
			}

		//* Same pattern by decrease by one as we are bring the selections up

			if(this.selections[i].active.line < this.origin.active.line){

				let indexSubtrahend: number = this.selectionSequence.lesserThenOrigin.indexOf(this.selections[i].active.line)+1;

				const newPosition: {active:vscode.Position, anchor: vscode.Position} = {
					active: (()=>{ 

						const activeLine = this.selections[i].active.line - indexSubtrahend;
						const activeChar =  this.selections[i].active.character;

						if(activeLine < 0){
							return new vscode.Position(0,0);
						}

						return new vscode.Position(activeLine, activeChar);

					})(),
					anchor: (()=>{ 

						const anchorLine = this.selections[i].anchor.line - indexSubtrahend;
						const anchorChar =  this.selections[i].anchor.character;

						if(anchorLine < 0){
							return new vscode.Position(0,0);
						}

						return new vscode.Position(anchorLine, anchorChar);

					})(),
				};

				const newSelection: vscode.Selection = new vscode.Selection(newPosition.anchor,newPosition.active);
				
				newSelections.push(newSelection);

				continue;
			}

		//* We don't give indexAddend/indexSubtrahend to the origin

			if(this.selections[i].active.line === this.origin.active.line){
				newSelections.push(this.selections[i]);
				continue;
				
			}

		}


		vscode.window.activeTextEditor!.selections = newSelections;
		return newSelections;
	}
}


export class paddingCmd{

	private static originAddend : number = 0;
	private static prevSelectionAmount : number = vscode.window.activeTextEditor!.selections.length;

	protected static currentOrigin = () : vscode.Selection | undefined =>{
		const arr : vscode.Selection[] = [];
		vscode.window.activeTextEditor!.selections.map(x => arr.push(x));
		arr.sort((a,b)=>{return a.active.line - b.active.line;});
		
		let indexMedian = Math.round(arr.length/2) - 1;
		let originIndex : number = indexMedian + this.originAddend;

	
		if(arr.length !== this.prevSelectionAmount){ // when you create a new a selection or remove a selection it automatically make the origin the median of selections
			originIndex = indexMedian;
		}

		this.prevSelectionAmount = arr.length;

		return arr.at(originIndex);

	};

	private static disposeDecoration(decoration : vscode.TextEditorDecorationType){

		Decoration.decorationInstances.push(decoration);
		Decoration.decorationInstances.at(-2)?.dispose();
	}

	static pad(decorationFilePath : string) { //possibly make mutiple variations of these functions so i dont need to make a new Decoration object and make it shared

		return ()=>{

			const decorationOptions : object = { 
			
				gutterIconPath : vscode.Uri.file(decorationFilePath),
				gutterIconSize : "100%"
					
			};

			const originSelection : vscode.Selection | undefined = this.currentOrigin();

			const circleDecoration = new Decoration(decorationFilePath, decorationOptions);

			const origin = new Origin(originSelection, circleDecoration);

			Decoration.decorationInstances.push(circleDecoration.decoration);
			Decoration.decorationInstances.at(-2)?.dispose();
			origin.indicate();

			new Padding(origin.selection).pad();

			

		};
	}

	static originUp(decorationFilePath : string, ){
		

		return () =>{
			
			

			const decorationOptions : object = { 
			
				gutterIconPath : vscode.Uri.file(decorationFilePath),
				gutterIconSize : "100%"
					
			};

			this.originAddend--;

			if(Math.abs(this.originAddend) >= vscode.window.activeTextEditor!.selections.length){

				this.originAddend = 0;

			}

			const originSelection : vscode.Selection | undefined = this.currentOrigin();
			const circleDecoration = new Decoration(decorationFilePath, decorationOptions);

			const origin = new Origin(originSelection, circleDecoration);
			this.disposeDecoration(circleDecoration.decoration);

			
			origin.indicate();

		};
	}
}

export function activate(context: vscode.ExtensionContext) {

	const mediaPath = (() : string =>{	

		const path = (__dirname.split('\\'));
		path.pop(); //To take out \out

		/**
		 ** ^^^^^^^^^^
		 ** This may need to be configured for different folder directories.
		 */

		 return path.join('\\') + '\\media\\circle.svg';
	})();
	
	
	const disposablePadding = vscode.commands.registerCommand("multicursorex.padding.pad" ,  paddingCmd.pad(mediaPath));	
	
	context.subscriptions.push(disposablePadding);

	const disposableOriginUp = vscode.commands.registerCommand("multicursorex.padding.originUp" ,  paddingCmd.originUp(mediaPath, ));	
	
	context.subscriptions.push(disposableOriginUp);
}

export function deactivate() {}


