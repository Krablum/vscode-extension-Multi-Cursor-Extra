import { throws } from 'assert';
import {assert, Console, error } from 'console';
import * as vscode from 'vscode';

// Facade Design Pattern

class Origin{

	selection : vscode.Selection;
	visual : Decoration;
	private changeEventListener?: vscode.Disposable;

	constructor(selection : vscode.Selection | undefined, decoration : Decoration){

		if(typeof(selection) === "undefined"){

			throw error('Origin: Argument "selection" is undefined');
		}

		this.selection = selection;
		this.visual = decoration;
		
	}

	transformation = {

		up : ()=>{

			const lineSet = new Set<number>();
			vscode.window.activeTextEditor!.selections.map(x => lineSet.add(x.active.line));
			lineSet.add(this.selection.active.line);

			const lineArr = [...lineSet];
			lineArr.sort((a,b)=>{return a - b;});

			console.log(lineArr);
			console.log	(this.selection);
			console.log(lineArr.indexOf(this.selection.active.line));
			console.log(lineArr.indexOf(this.selection.active.line)-1);

			const lineUp : vscode.Position = new vscode.Position(lineArr.at(lineArr.indexOf(this.selection.active.line)-1)!, 0);
 
			const newOrigin = new vscode.Selection(lineUp, lineUp);

			this.selection = newOrigin;

			return this.selection;

		},

		down : ()=>{

			const lineSet = new Set<number>();
			vscode.window.activeTextEditor!.selections.map(x => lineSet.add(x.active.line));
			lineSet.add(this.selection.active.line);

			const lineArr = [...lineSet];
			lineArr.sort((a,b)=>{return a - b;});

			console.log(lineArr);
			console.log	(this.selection);
			console.log(lineArr.indexOf(this.selection.active.line));
			console.log(lineArr.indexOf(this.selection.active.line)+1);

			const lineUp : vscode.Position = new vscode.Position(lineArr.at(lineArr.indexOf(this.selection.active.line)-1)!, 0);
 
			const newOrigin = new vscode.Selection(lineUp, lineUp);

			this.selection = newOrigin;

			return this.selection;



		}
		
	};

	indicate(){

		const range = new vscode.Range(this.selection.end, this.selection.end);

		vscode.window.activeTextEditor!.setDecorations(this.visual.decoration, [range]);

		if(this.changeEventListener){

			this.changeEventListener.dispose();

		}
		
		this.changeEventListener = vscode.workspace.onDidChangeTextDocument(()=>{ //Always fire when change as subscription is placed on the event - It is use to make the decoration is not duplicated when press enter in the text editor
			vscode.window.activeTextEditor!.setDecorations(this.visual.decoration, [range]);
		});

		setTimeout(()=>{//decoration will disapper in 5 second

			this.visual.decoration.dispose();
			this.changeEventListener?.dispose();

		}, 2000);
	
	}
}

class Decoration{

	decorationFilePath : string;
	decorationOptions: vscode.DecorationRenderOptions;
	decoration: vscode.TextEditorDecorationType;

	constructor(filePath : string, options : object){

		this.decorationFilePath = filePath;
		this.decorationOptions = options;
		this.decoration = vscode.window.createTextEditorDecorationType(this.decorationOptions);
	}

	disposeDecoration(){ 
		this.decoration.dispose();
	}
}



class Padding{

	origin : Origin;

	selections : readonly vscode.Selection[] =  vscode.window.activeTextEditor!.selections; 

	constructor(origin : Origin){

		this.origin= origin;

	}

	selectionSequence : {greaterThenOrigin : number[], lesserThenOrigin : number[]} = {

		greaterThenOrigin : [],
		lesserThenOrigin : []
	};

	order(){ // to order the the two arrays the pad() will use so the index-based logic will be correct

		for(let n = 0; n < this.selections.length; n++){
			if(this.selections[n].active.line > this.origin.selection.active.line) {
				
				this.selectionSequence.greaterThenOrigin.push(this.selections[n].active.line);
				continue;
			} 
			
			if(this.selections[n].active.line  < this.origin.selection.active.line){

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

			if(this.selections[i].active.line > this.origin.selection.active.line){
				
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

			if(this.selections[i].active.line < this.origin.selection.active.line){

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

			if(this.selections[i].active.line === this.origin.selection.active.line){
				newSelections.push(this.selections[i]);
				continue;
				
			}

		}


		vscode.window.activeTextEditor!.selections = newSelections;
		return newSelections;
	}
}


export class paddingCmd{

	private static decorationFilePath : string;
	private static decorationOptions : object;
	private static currentOriginSelection : vscode.Selection | undefined; 
	private static lockOriginToMedianBool : boolean = true;
	private static decorationInstances : Decoration[] =[];


	private static selectionMedian() : vscode.Selection | undefined{

		const arr : vscode.Selection[] = [];
		vscode.window.activeTextEditor!.selections.map(x => arr.push(x));
		arr.sort((a,b)=>{return a.active.line - b.active.line;});
		
		let indexMedian = Math.round(arr.length/2) - 1;

		return arr.at(indexMedian);

	};


	private static applyDecorationConfiguration(filePath : string) : object{
		this.decorationFilePath = filePath;

		this.decorationOptions = {

			gutterIconPath : vscode.Uri.file(filePath),
			gutterIconSize : "72%"
			

		};

		return this.decorationOptions;

	}

	static disposeAllDecoration(){
		
		for(const element of this.decorationInstances){

			element.disposeDecoration();

		}

		this.decorationInstances = [];

	}

	static pad(mediaPath: string) { //possibly make mutiple variations of these functions so i dont need to make a new Decoration object and make it shared

		return ()=>{

			this.applyDecorationConfiguration(mediaPath);

			if(this.lockOriginToMedianBool === true){

				this.currentOriginSelection = this.selectionMedian();

			}

			const circleDecoration = new Decoration(this.decorationFilePath, this.decorationOptions);
			const origin = new Origin(this.currentOriginSelection, circleDecoration);

			this.decorationInstances.push(circleDecoration);
			const decorationDelete : Decoration | undefined = this.decorationInstances.at(-2);

			if(decorationDelete !== undefined){
			
				decorationDelete!.disposeDecoration();
				this.decorationInstances.splice(this.decorationInstances.indexOf(decorationDelete!), 1);

			}

			
			console.log(this.decorationInstances);

			origin.indicate();

			new Padding(origin).pad();
			

		};
	}

	static originUp(mediaPath: string){

		return ()=>{

			this.applyDecorationConfiguration(mediaPath);

			if(this.currentOriginSelection === undefined){
				this.currentOriginSelection = this.selectionMedian();
			}

			const circleDecoration = new Decoration(this.decorationFilePath, this.decorationOptions);
			
			const origin = new Origin(this.currentOriginSelection, circleDecoration);
			
			this.decorationInstances.push(circleDecoration);
			const decorationDelete : Decoration | undefined = this.decorationInstances.at(-2);

			if(decorationDelete !== undefined){
			
				decorationDelete!.disposeDecoration();
				this.decorationInstances.splice(this.decorationInstances.indexOf(decorationDelete!), 1);

			}

			console.log(this.decorationInstances);

			this.currentOriginSelection = origin.transformation.up();
			
			origin.indicate();

			this.lockOriginToMedianBool = false;
		};
	}

	static originDown(mediaPath: string){

		return ()=>{

			this.applyDecorationConfiguration(mediaPath);

			if(this.currentOriginSelection === undefined){
				this.currentOriginSelection = this.selectionMedian();
			}

			const circleDecoration = new Decoration(this.decorationFilePath, this.decorationOptions);
			
			const origin = new Origin(this.currentOriginSelection, circleDecoration);
			
			this.decorationInstances.push(circleDecoration);
			const decorationDelete : Decoration | undefined = this.decorationInstances.at(-2);

			if(decorationDelete !== undefined){
			
				decorationDelete!.disposeDecoration();
				this.decorationInstances.splice(this.decorationInstances.indexOf(decorationDelete!), 1);

			}

			console.log(this.decorationInstances);

			this.currentOriginSelection = origin.transformation.down();
			
			origin.indicate();

			this.lockOriginToMedianBool = false;

		};
	}

	static lockOriginToMedian(){

		return ()=>{

			this.lockOriginToMedianBool = !this.lockOriginToMedianBool;
			console.log(this.lockOriginToMedianBool);

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

		 return path.join('\\') + '\\media\\origin.svg';
	})();
	
	
	const disposablePadding = vscode.commands.registerCommand("multicursorex.padding.pad" ,  paddingCmd.pad(mediaPath));	
	const disposableOriginUp = vscode.commands.registerCommand("multicursorex.padding.originUp" , paddingCmd.originUp(mediaPath));	
	const disposableOriginDown = vscode.commands.registerCommand("multicursorex.padding.originDown" , paddingCmd.originDown(mediaPath));	
	const disposableLockOriginToMedian =  vscode.commands.registerCommand("multicursorex.padding.lockOriginToMedian" , paddingCmd.lockOriginToMedian());	
	
	context.subscriptions.push(disposablePadding, disposableOriginUp, disposableOriginDown, disposableLockOriginToMedian);
	

}

export function deactivate() {

	paddingCmd.disposeAllDecoration();

}


