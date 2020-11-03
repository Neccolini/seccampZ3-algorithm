import { Parser } from "rerejs";

interface edge {
    char: string;
    from: number;
    to: number;
}

interface State {
    id: number;
    transition: Array<edge>;
}

class RegexToNFA {
    public pattern: any;
    public NFA: Array<State> = [];

    constructor(Regex: string, flag: string = 'u') {
        const parser = new Parser(Regex, flag);
        this.pattern = parser.parse();
        let q: State = { id: 0, transition: [] };
        this.NFA.push(q);
        this.nfa(this.pattern.child, 0, 1);
        this.AddFinite();//終端ノードを追加
    }

    private nfa(pattern: any, from_: number, to_: number): void {
        const type: string = pattern.type;
        switch (type) {
            case "Char": {
                const raw: string = pattern.raw;
                let e: edge = { char: raw, from: from_, to: to_ };
                this.Add(e);
            }
                break;
            case "Dot": {
                let e: edge = { char: '.', from: from_, to: to_ };
                this.Add(e);
            }
                break;
            case "Disjunction": {
                let children = pattern.children;
                for (let i = 0; i < children.length; i++) {
                    let e: edge = { char: 'ε', from: from_, to: from_ + i + 1 };
                    this.Add(e);
                    this.nfa(children[i], from_ + i + 1, from_ + i + 1 + children.length);
                }
            } break;

            case "Sequence": {
                let children = pattern.children;
                let e: edge = { char: "ε", from: from_, to: from_ + 1 };
                this.Add(e);
                for (let i = 0; i < children.length; i++) {
                    this.nfa(children[i], from_ + 1 + i, from_ + 2 + i);
                }
            } break;
            case "Capture":
            case 'NamedCapture':
            case 'Group': {
                this.nfa(pattern.child, from_, to_);
            } break;

        }

    }

    private Add(e: edge): void {
        //this.NFAの長さが足りなかったらその分だけ追加
        if (this.NFA.length <= e.to) {
            for (let i = 0; i <= e.to + 1 - this.NFA.length; i++) {
                let q: State = { id: this.NFA.length + i, transition: [] };
                this.NFA.push(q);
            }
        }
        this.NFA[e.from].transition.push(e);
        this.NFA[e.from].id = e.from;
        this.NFA[e.to].id = e.to;
    }

    private AddFinite() {
        const finite_id = this.NFA.length;
        for (let i = 0; i < this.NFA.length; i++) {
            if (!this.NFA[i].transition.length && i != finite_id) {
                let e: edge = { char: 'ε', from: i, to: finite_id };
                this.Add(e);
            }
        }
    }

}


//test
let NFA = new RegexToNFA("(ab|c)");
for (let i = 0; i < NFA.NFA.length; i++) {
    console.log(NFA.NFA[i]);
}