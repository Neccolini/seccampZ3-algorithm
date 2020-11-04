import { Parser } from "rerejs";

interface edge {
    char: string;
    from: number;
    to: number;
    //priority:number;
}

interface State {
    id: number;
    transition: Array<edge>;
}

class RegexToNFA {
    public pattern: any;
    public NFA: Array<State> = [];
    private edge_list:Array<edge>=[];
    constructor(Regex: string, flag: string = 'u') {
        const parser = new Parser(Regex, flag);
        this.pattern = parser.parse();
        const q: State = { id: 0, transition: [] };//始点ノードを追加(1つのみ)
        this.NFA.push(q);
        //const e:edge={char:"ε", from:0,to:1};
        //this.Add(e);
        this.nfa(this.pattern.child, 0, 1);
        this.AddFinite();//終端ノードを追加
    }

    private nfa(pattern: any, from_: number, to_: number): void {
        this.AddNode(Math.max(from_,to_));
        const type: string = pattern.type;
        switch (type) {
            case "Char": 
            case "EscapeClass":
            case "NamedBackRef":{
                const raw: string = pattern.raw;
                let e: edge = { char: raw, from: from_, to: to_ };
                this.Add(e);
            }break;

            case "Dot": {
                let e: edge = { char: '.', from: from_, to: to_ };
                this.Add(e);
            }break;

            case "Class":{
                //

            }break;

            case "WordBoundary":
            case "LineBegin":
            case "LineEnd":
            case "LookAhead":
            case "LookBehind":{
                //
            }break;
            case "Disjunction": {
                const children = pattern.children;
                let start_list:Array<number>=[];
                let end_list:Array<number>=[];
                let new_from:number=to_+1;
                let new_next:number=new_from+1;
                for (let i = 0; i < children.length; i++) {
                    start_list.push(new_from);
                    end_list.push(new_next);
                    this.nfa(children[i], new_from,new_next);
                    new_from=this.NFA.length;
                    new_next=new_from+1;
                }
                //qから分岐のそれぞれにε遷移
                for(let i of start_list){
                    let e:edge={char:"ε", from:from_, to:i};
                    this.Add(e);
                }
                //それぞれの分岐の終わりからfにε遷移
                for(let i of end_list){
                    let e:edge={char:"ε",from:i,to:to_};
                    this.Add(e);
                }


            } break;

            case "Sequence": {
                const children:any = pattern.children;
                let from:number=from_;
                let next:number=this.NFA.length+1;
                for (let i = 0; i < children.length; i++) {
                    if(i==children.length-1){
                        this.nfa(children[i],from,to_);
                        break;
                    }
                    this.nfa(children[i],from,next);
                    from=next;
                    next+=1;
                }
            } break;

            case "Capture":
            case 'NamedCapture':
            case 'Group': {
                this.nfa(pattern.child, from_, to_);
            } break;
            case "Some":{
                const child: any = pattern.child;
                const isGreedy: boolean = !pattern.nonGreedy;
                const length: number = this.NFA.length;
                //最初のε遷移
                const q: edge = { char: "ε", from: from_, to: length };
                this.Add(q);

                this.nfa(child, length, length + 1);//内部の遷移

                //繰り返しを表すε遷移
                const e: edge = { char: "ε", from: length + 1, to: length };
                this.Add(e);

                //最後のε遷移
                const e2: edge = { char: "ε", from: length + 1, to: to_ };
                this.Add(e2);
            }break;

            case "Many":{
                const child: any = pattern.child;
                const isGreedy: boolean = !pattern.nonGreedy;
                const length: number = this.NFA.length;
                //最初のε遷移
                const q: edge = { char: "ε", from: from_, to: length };
                this.Add(q);

                this.nfa(child, length, length + 1);//内部の遷移

                //繰り返しを表すε遷移
                const e: edge = { char: "ε", from: length + 1, to: length };
                this.Add(e);

                //最後のε遷移
                const e2: edge = { char: "ε", from: length + 1, to: to_ };
                this.Add(e2);

                //空文字を受理するε遷移
                const empty: edge = { char: "ε", from: from_, to: to_ };
                this.Add(empty);
            }break;

            case "Optional":{
                const child:any=pattern.child;
                const isGreedy: boolean = !pattern.nonGreedy;
                //空文字を受理
                const empty:edge={char:"ε", from:from_,to:to_};
                this.Add(empty);
                this.nfa(child,from_,to_);
            }break;

            case "Repeat":{
                const min:number=pattern.min;
                const max:number=pattern.max;
                const isGreedy:boolean=!pattern.nonGreedy;
                const child:any=pattern.child;
                let from:number=from_;
                let next:number=this.NFA.length;
                //最大の遷移数を確保
                for(let i=0;i<max;i++){
                    if(i==max-1){
                        this.nfa(child,from,to_);
                        break;
                    }
                    this.nfa(child,from,next);
                    from=next;
                    next++;
                }
                from=from_;
                next-=max-1;
                //ε遷移
                for(let i=0;i<max-min;i++){
                    if(i==max-1){
                        let e:edge={char:"ε", from:from,to:to_};
                        this.Add(e);
                    }
                    let e:edge={char:"ε", from:from,to:next};
                    this.Add(e);
                    from=next;
                    next++;
                }
            }break;

            
        }
    }

    private AddNode(length:number){
        //this.NFA.length==lengthになるまでnodeを追加
        if (this.NFA.length <= length) {
            let length: number = this.NFA.length;
            for (let i = 0; i < length + 1 - length; i++) {
                let q: State = { id: this.NFA.length + i, transition: [] };
                this.NFA.push(q);
            }
        }
    }
    private Add(e: edge): void {
        //this.NFAの長さが足りなかったらその分だけ追加
        this.AddNode(Math.max(e.from,e.to));
        this.NFA[e.from].transition.push(e);
        this.NFA[e.from].id = e.from;
        this.NFA[e.to].id = e.to;
        this.edge_list.push(e);
    }

    private AddFinite() {
        //受領状態を追加
        const finite_id = this.NFA.length;
        for (let i = 0; i < this.NFA.length; i++) {
            if (!this.NFA[i].transition.length && i != finite_id) {
                let e: edge = { char: 'ε', from: i, to: finite_id };
                this.Add(e);
            }
        }
    }
    public debug(){
        //debug
        for (let i = 0; i < this.NFA.length; i++) {
            console.log(this.NFA[i]);
        }
    }
    public NFAToGraph(){
        //for viz.js
        console.log("digraph εNFA{\n"+'rankdir="LR"');
        console.log(` 0 [shape= doublecircle, fillcolor=lightsteelblue1, style=filled, color = navyblue ]`);
        console.log(this.NFA.length - 1 +` [shape= circle, fillcolor=lightsteelblue1, style=filled, color = navyblue ]`);
        this.edge_list.forEach((e:edge)=>{
            console.log(
                `${e.from}->${e.to} [label="${e.char}"]`
                //" " + e.from + " -> " + e.to + " [label=\"" + e.char + "\"]"
            );
        });
        console.log("}");
    }

}

/*
//test
let NFA = new RegexToNFA("(a|b|c*)+");//->Ok
NFA.debug();
NFA.NFAToGraph();

*/