import "./styles.css";
import "./knob.png";

import * as Rx from "rxjs/Rx";
import * as template from "!raw-loader!./template.html";
import * as $ from "jquery";

export default class Test3 implements IDisposable {

    private subscription: Rx.Subscription | undefined;

    constructor() {

        $("#content").html(template);

        this.connectMidiController($("#connect").get(0));
    }

    dispose(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    /**
     * Connect to a MIDI input (just pick the first found)
     * @param connectBtn A button
     */
    private connectMidiController = function (this: Test3, connectBtn: HTMLElement): void {

        this.subscription = Rx.Observable.fromEvent(connectBtn, "click")
            .take(1)
            .flatMapTo(Rx.Observable.fromPromise(navigator.requestMIDIAccess()))
            .flatMap((access: WebMidi.MIDIAccess, index: number) => {
                if (access.inputs.size === 0) {
                    throw "No MIDI input detected.";
                }
                let input: WebMidi.MIDIInput = access.inputs.values().next().value!;
                let subject: Rx.Subject<number> = new Rx.Subject();
                input.addEventListener("midimessage", (event: Event) => {
                    let midiEvent: WebMidi.MIDIMessageEvent = event as WebMidi.MIDIMessageEvent;
                    subject.next(Math.round(midiEvent.data[2] / 127 * 100));
                });
                console.log(`Listening to input '${input.name}'...`);
                return subject;
            })
            .subscribe(
                (state: number) => {
                    let angle: number = state / 100 * 360;
                    $("#knob").css("-webkit-transform", `rotate(${angle}deg)`);
                    $("#knob").css("transform", `rotate(${angle}deg)`);
                    $("#knob-value h3").text(state);
                    console.log(state);
                },
                error => console.error(error)
            );
    };
}