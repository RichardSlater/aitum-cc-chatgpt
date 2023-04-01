import { ICCActionInputs, ICustomCode } from 'aitum.js/lib/interfaces';
import { BooleanInput, FloatInput, IntInput, StringInput } from 'aitum.js/lib/inputs';
import { AitumCC } from 'aitum.js';
import { DeviceType } from 'aitum.js/lib/enums';

/*********** CONFIG ***********/
// The custom code action name
const name: string = 'Chat GPT';

// The custom code inputs
const inputs: ICCActionInputs = {
  question: new StringInput('Question', { required: true }),
  command: new StringInput('Command (i.e. !ask)', { required: false })
}

// The code executed.
async function method(inputs: { [key: string]: number | string | boolean | string[] }) {
  const lib = AitumCC.get().getAitumJS();
  const twitchDevices = await lib.aitum.getDevices(DeviceType.TWITCH);

  if (twitchDevices === undefined || twitchDevices.length == 0) {
    console.error("Aitum Twitch Device undefined.");
    return;
  }

  const twitch = twitchDevices[0];

  if (process.env.OPENAI_API_KEY == undefined) {
    console.error("OPENAI_API_KEY not defined, aborting.");
    return;
  }

  var question = inputs.question as string;

  if (inputs.command || inputs.command != '') {
    if (!question.startsWith(inputs.command as string)) {
      console.log("Custom Code executed, but did not match the command in " + question);
      console.log("For performance reasons it is recommended that a Check for the command is added in Aitum.");
      return;
    }
    question = question.replace(inputs.command + ' ', '');
  }

  const importDynamic = new Function( 'modulePath', 'return import(modulePath)', );
  const { ChatGPTAPI } = await importDynamic("chatgpt");
  const api = new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY })

  const res = await api.sendMessage(question);

  if (res == undefined) {
    console.error("ChatGPT response was undefined, IDK what happened.");
    return;
  }

  if (res.text === undefined || res.text === '') {
    console.error("ChatGPT text was undefined or empty, IDK what happened.");
    return;
  }

  await twitch.sendMessage(res.text);
}

/*********** DON'T EDIT BELOW ***********/
export default { name, inputs, method } as ICustomCode;