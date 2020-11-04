"use strict";
exports.__esModule = true;
var rerejs_1 = require("rerejs");
var RegexToNFA = /** @class */ (function () {
    function RegexToNFA(Regex, flag) {
        if (flag === void 0) { flag = 'u'; }
        this.NFA = [];
        this.edge_list = [];
        var parser = new rerejs_1.Parser(Regex, flag);
        this.pattern = parser.parse();
        var q = { id: 0, transition: [] }; //始点ノードを追加(1つのみ)
        this.NFA.push(q);
        //const e:edge={char:"ε", from:0,to:1};
        //this.Add(e);
        this.nfa(this.pattern.child, 0, 1);
        this.AddFinite(); //終端ノードを追加
    }
    RegexToNFA.prototype.nfa = function (pattern, from_, to_) {
        this.AddNode(Math.max(from_, to_));
        var type = pattern.type;
        switch (type) {
            case "Char":
            case "EscapeClass":
            case "NamedBackRef":
                {
                    var raw = pattern.raw;
                    var e = { char: raw, from: from_, to: to_ };
                    this.Add(e);
                }
                break;
            case "Dot":
                {
                    var e = { char: '.', from: from_, to: to_ };
                    this.Add(e);
                }
                break;
            case "Class":
                {
                    //
                }
                break;
            case "WordBoundary":
            case "LineBegin":
            case "LineEnd":
            case "LookAhead":
            case "LookBehind":
                {
                    //
                }
                break;
            case "Disjunction":
                {
                    var children = pattern.children;
                    var start_list = [];
                    var end_list = [];
                    var new_from = to_ + 1;
                    var new_next = new_from + 1;
                    for (var i = 0; i < children.length; i++) {
                        start_list.push(new_from);
                        end_list.push(new_next);
                        this.nfa(children[i], new_from, new_next);
                        new_from = this.NFA.length;
                        new_next = new_from + 1;
                    }
                    //qから分岐のそれぞれにε遷移
                    for (var _i = 0, start_list_1 = start_list; _i < start_list_1.length; _i++) {
                        var i = start_list_1[_i];
                        var e = { char: "ε", from: from_, to: i };
                        this.Add(e);
                    }
                    //それぞれの分岐の終わりからfにε遷移
                    for (var _a = 0, end_list_1 = end_list; _a < end_list_1.length; _a++) {
                        var i = end_list_1[_a];
                        var e = { char: "ε", from: i, to: to_ };
                        this.Add(e);
                    }
                }
                break;
            case "Sequence":
                {
                    var children = pattern.children;
                    var from = from_;
                    var next = this.NFA.length + 1;
                    for (var i = 0; i < children.length; i++) {
                        if (i == children.length - 1) {
                            this.nfa(children[i], from, to_);
                            break;
                        }
                        this.nfa(children[i], from, next);
                        from = next;
                        next += 1;
                    }
                }
                break;
            case "Capture":
            case 'NamedCapture':
            case 'Group':
                {
                    this.nfa(pattern.child, from_, to_);
                }
                break;
            case "Some":
                {
                    var child = pattern.child;
                    var isGreedy = !pattern.nonGreedy;
                    var length_1 = this.NFA.length;
                    //最初のε遷移
                    var q = { char: "ε", from: from_, to: length_1 };
                    this.Add(q);
                    this.nfa(child, length_1, length_1 + 1); //内部の遷移
                    //繰り返しを表すε遷移
                    var e = { char: "ε", from: length_1 + 1, to: length_1 };
                    this.Add(e);
                    //最後のε遷移
                    var e2 = { char: "ε", from: length_1 + 1, to: to_ };
                    this.Add(e2);
                }
                break;
            case "Many":
                {
                    var child = pattern.child;
                    var isGreedy = !pattern.nonGreedy;
                    var length_2 = this.NFA.length;
                    //最初のε遷移
                    var q = { char: "ε", from: from_, to: length_2 };
                    this.Add(q);
                    this.nfa(child, length_2, length_2 + 1); //内部の遷移
                    //繰り返しを表すε遷移
                    var e = { char: "ε", from: length_2 + 1, to: length_2 };
                    this.Add(e);
                    //最後のε遷移
                    var e2 = { char: "ε", from: length_2 + 1, to: to_ };
                    this.Add(e2);
                    //空文字を受理するε遷移
                    var empty = { char: "ε", from: from_, to: to_ };
                    this.Add(empty);
                }
                break;
            case "Optional":
                {
                    var child = pattern.child;
                    var isGreedy = !pattern.nonGreedy;
                    //空文字を受理
                    var empty = { char: "ε", from: from_, to: to_ };
                    this.Add(empty);
                    this.nfa(child, from_, to_);
                }
                break;
            case "Repeat":
                {
                    var min = pattern.min;
                    var max = pattern.max;
                    var isGreedy = !pattern.nonGreedy;
                    var child = pattern.child;
                    var from = from_;
                    var next = this.NFA.length;
                    //最大の遷移数を確保
                    for (var i = 0; i < max; i++) {
                        if (i == max - 1) {
                            this.nfa(child, from, to_);
                            break;
                        }
                        this.nfa(child, from, next);
                        from = next;
                        next++;
                    }
                    from = from_;
                    next -= max - 1;
                    //ε遷移
                    for (var i = 0; i < max - min; i++) {
                        if (i == max - 1) {
                            var e_1 = { char: "ε", from: from, to: to_ };
                            this.Add(e_1);
                        }
                        var e = { char: "ε", from: from, to: next };
                        this.Add(e);
                        from = next;
                        next++;
                    }
                }
                break;
        }
    };
    RegexToNFA.prototype.AddNode = function (length) {
        //this.NFA.length==lengthになるまでnodeを追加
        if (this.NFA.length <= length) {
            var length_3 = this.NFA.length;
            for (var i = 0; i < length_3 + 1 - length_3; i++) {
                var q = { id: this.NFA.length + i, transition: [] };
                this.NFA.push(q);
            }
        }
    };
    RegexToNFA.prototype.Add = function (e) {
        //this.NFAの長さが足りなかったらその分だけ追加
        this.AddNode(Math.max(e.from, e.to));
        this.NFA[e.from].transition.push(e);
        this.NFA[e.from].id = e.from;
        this.NFA[e.to].id = e.to;
        this.edge_list.push(e);
    };
    RegexToNFA.prototype.AddFinite = function () {
        //受領状態を追加
        var finite_id = this.NFA.length;
        for (var i = 0; i < this.NFA.length; i++) {
            if (!this.NFA[i].transition.length && i != finite_id) {
                var e = { char: 'ε', from: i, to: finite_id };
                this.Add(e);
            }
        }
    };
    RegexToNFA.prototype.debug = function () {
        //debug
        for (var i = 0; i < this.NFA.length; i++) {
            console.log(this.NFA[i]);
        }
    };
    RegexToNFA.prototype.NFAToGraph = function () {
        //for viz.js
        console.log("digraph εNFA{\n" + 'rankdir="LR"');
        console.log(" 0 [shape= doublecircle, fillcolor=lightsteelblue1, style=filled, color = navyblue ]");
        console.log(this.NFA.length - 1 + " [shape= circle, fillcolor=lightsteelblue1, style=filled, color = navyblue ]");
        this.edge_list.forEach(function (e) {
            console.log(e.from + "->" + e.to + " [label=\"" + e.char + "\"]"
            //" " + e.from + " -> " + e.to + " [label=\"" + e.char + "\"]"
            );
        });
        console.log("}");
    };
    return RegexToNFA;
}());
//test
var NFA = new RegexToNFA("(a|b|c*)+");
NFA.debug();
NFA.NFAToGraph();
