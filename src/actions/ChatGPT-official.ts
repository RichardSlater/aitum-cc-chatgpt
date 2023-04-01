import { ICCActionInputs, ICustomCode } from 'aitum.js/lib/interfaces';
import { BooleanInput, FloatInput, IntInput, StringInput } from 'aitum.js/lib/inputs';
import { AitumCC } from 'aitum.js';
import { DeviceType } from 'aitum.js/lib/enums';
import { Configuration, OpenAIApi } from 'openai';

/*********** CONFIG ***********/
// The custom code action name
const name: string = 'Chat GPT (/w Unofficial)';

// The custom code inputs
const inputs: ICCActionInputs = {
  question: new StringInput('Question', { required: true }),
  command: new StringInput('Command (i.e. !ask)', { required: false })
}

// The code executed.
async function method(inputs: { [key: string]: number | string | boolean | string[] }) {
  const lib = AitumCC.get().getAitumJS();

  // Fetch the Aitum Device representing Twitch
  const twitchDevices = await lib.aitum.getDevices(DeviceType.TWITCH);

  // GUARD CLAUSE #1: fail fast if the Aitum Device is not found for any reason.
  if (twitchDevices === undefined || twitchDevices.length == 0) {
    console.error("Aitum Twitch Device undefined.");
    return;
  }

  const twitch = twitchDevices[0];

  // GUARD CLAUSE #2: exit if the OPEN_API_KEY isn't found in the environment.
  if (process.env.OPENAI_API_KEY == undefined) {
    console.error("OPENAI_API_KEY not defined, aborting - try adding it to settings.env.");
    return;
  }

  // cast the question to string, as we know it's required.
  var question = inputs.question as string;

  // check if the command was specified
  if (inputs.command || inputs.command != '') {

    // this will log messages if !ask is used somewhere other than at the beginning of the line
    // so this will filter out anyone typing "try using !ask to ask ChatGPT a question"
    if (!question.startsWith(inputs.command as string)) {
      console.log("Custom Code executed, but did not match the command in " + question);
      console.log("For performance reasons it is recommended that a Check for the command is added in Aitum.");
      return;
    }

    // remove the command from the question
    question = question.replace(inputs.command + ' ', '');
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  // finally we send the message to ChatGPTs API
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "Hello world",
  });

  // check the response is defined
  if (completion == undefined) {
    console.error("Open AI response was undefined, IDK what happened.");
    return;
  }

  // and that the text is not null or empty
  if (completion.data?.choices[0]?.text === undefined || completion.data?.choices[0]?.text === '') {
    console.error("ChatGPT text was undefined or empty, IDK what happened.");
    return;
  }

  // send the message on Twitch
  await twitch.sendMessage("completion.data?.choices[0]?.text");
}

/*********** DON'T EDIT BELOW ***********/
export default { name, inputs, method } as ICustomCode;