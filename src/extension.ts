	import { error } from 'console';
	import * as vscode from 'vscode';

	type ExParam = [
		origin? : vscode.Selection,
		mediaPath? : string,
	]

	abstract class CursorEx{

		selections : readonly vscode.Selection[] = vscode.window.activeTextEditor!.selections;

		static commandFn(...args:ExParam) : (...args:any[])=>(any) {
			return ()=>{

			};
		}
	}

	abstract class PaddingClass extends CursorEx{

		decorationFilePath : string;
		decorationOptions: vscode.DecorationRenderOptions;
		decoration: vscode.TextEditorDecorationType;
		static decorationInstances : vscode.TextEditorDecorationType[] =[];

		origin : vscode.Selection;
		selectionPositionOrder : number[][] = [[],[]];

		constructor(origin : vscode.Selection, filePath : string){
			super();

			this.origin = (vscode.window.activeTextEditor!.selections).at(-1)!;

			
			this.decorationFilePath = filePath;
			this.decorationOptions = {

				gutterIconPath : vscode.Uri.file(filePath),
				gutterIconSize : "100%"

			};
			this.decoration = vscode.window.createTextEditorDecorationType(this.decorationOptions);
		}



		originIndicate(){

				const range = new vscode.Range(this.origin.end, this.origin.end);

				vscode.window.activeTextEditor!.setDecorations(this.decoration, [range]);
				
				vscode.workspace.onDidChangeTextDocument(()=>{
					vscode.window.activeTextEditor!.setDecorations(this.decoration, [range]);
				});
			}

		static commandFn(origin : vscode.Selection, mediaPath : string): (...args: any[]) => (any){
			return ()=>{

			};
		};

	}

	class Padding extends PaddingClass{

		constructor(origin : vscode.Selection, filePath : string){
			super(origin, filePath);
		}

		private order() : number[][]{

			for(let n = 0; n < this.selections.length; n++){
				if(this.selections[n].end.line > this.origin.end.line) {
					
					this.selectionPositionOrder[1].push(this.selections[n].end.line);
					continue;
				} 
				
				if(this.selections[n].end.line  < this.origin.end.line){

					this.selectionPositionOrder[0].push(this.selections[n].end.line);
					continue;
				}
			}


		
			this.selectionPositionOrder[0].sort((a,b)=>{return b-a;});
			this.selectionPositionOrder[1].sort((a,b)=>{return a-b;});

			

			return this.selectionPositionOrder;
		}

	private pad() : vscode.Selection[]{ 

		const newSelections: vscode.Selection[] = [];

		//* for loop in which it iterates through all selection currently in the active editor and see whether the said selection is greater then the origin where the selection pads from
		//* after finding the greater selections the loop then takes the values of of index from selectionPositionOrder which is a 2d array which orders all the end.line value position
		//* this value is then added by 1 and is defined as indexAddend
		//* we then make new position objects in which we take the currently iterated selection then added by the indexAddend for both the start and end of a selection to change position of a selection
		//* this work as it makes a clear spacing called padding as it make a hierarchical pattern of the array for example(We have the selection ordered in position values {8,5,3,1} these values have index which follows {0,1,2,3} making it a indexAddend, add all elements by 1
		//* we now have a way to keep seperation between selections, as if we just add all selections by 1 it is the same pattern just move down. However if we add based on the index we now can keep padding) 

		
		for(let i = 0; i < this.selections.length; i++){

			if(this.selections[i].end.line > this.origin.end.line){
				
				let indexAddend: number = this.selectionPositionOrder[1].indexOf(this.selections[i].end.line)+1;

				const newPosition: {start:vscode.Position, end: vscode.Position} = {
					start: new vscode.Position(this.selections[i].start.line + indexAddend, this.selections[i].start.character),
					end: new vscode.Position(this.selections[i].end.line + indexAddend, this.selections[i].end.character)

				};

				const newSelection: vscode.Selection = new vscode.Selection(newPosition.start,newPosition.end);
				newSelections.push(newSelection);

				continue;
			}

		//* Same pattern by decrease by one as we are bring the selections up

			if(this.selections[i].end.line < this.origin.end.line){

				let indexAddend: number = this.selectionPositionOrder[0].indexOf(this.selections[i].end.line)+1;

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

		//* We don't give indexAddend to the origin

			if(this.selections[i].end.line === this.origin.end.line){
				newSelections.push(this.selections[i]);
				continue;
				
			}

		}


		vscode.window.activeTextEditor!.selections = newSelections;
		return newSelections;
	}



	static commandFn(origin : vscode.Selection, mediaPath : string) : (...args:any[])=>(any){

			return ()=>{
				const padding = new Padding(origin, mediaPath);

				this.decorationInstances.push(padding.decoration);
				this.decorationInstances.at(-2)?.dispose();
				console.log(this.decorationInstances);

				padding.originIndicate();
				console.log(padding.order());
				padding.pad();

			};
		}
	}

	class Anchor extends PaddingClass{


		constructor(origin : vscode.Selection, filePath : string){
			super(origin, filePath);

		}

		private originTransform = {

			up : () : vscode.Selection =>{  
				const arr : vscode.Selection[] = [];
				vscode.window.activeTextEditor!.selections.map((x)=>{arr.push(x);});
				arr.sort((a,b)=>{return a.end.line-b.end.line;});
				
				const index = arr.indexOf(this.origin)-1;
				const nextSelection : vscode.Selection | undefined =  arr.at(index);

				if(nextSelection === undefined){ throw error('Variable "nextSelection" is type of undefined');}

				this.origin = nextSelection;

				return nextSelection;
			},

			down : ()=>{

			}
		};
	}

	let origin : vscode.Selection = (vscode.window.activeTextEditor!.selections).at(-1)!;
	/**
	 * ! Variables for origin doesnt work for some reason and fix the origin indication
	 */

	export function activate(context: vscode.ExtensionContext) {

		const origin = (vscode.window.activeTextEditor!.selections).at(-1)!;
		const mediaPath = (() : string =>{	

			const path = (__dirname.split('\\'));
			path.pop(); //To take out \out
	
			/**
			 ** ^^^^^^^^^^
			 ** This may need to be configured for different folder directories.
			 */
	
			 return path.join('\\') + '\\media\\circle.svg';
		})();
	


		const disposablePadding = vscode.commands.registerCommand('multicursorex.padding.pad', Padding.commandFn(origin , mediaPath));	

		context.subscriptions.push(disposablePadding);

		const foo = new Anchor(origin,'C:\\Users\\Kevin\\Desktop\\vscode-extension-Multi-Cursor-Extra\\media\\circle.svg');

	}

	export function deactivate() {}



































	

