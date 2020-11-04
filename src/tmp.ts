
            case "Some": {
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
} break;