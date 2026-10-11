// The playable layer of each lesson: a "predict first" question, bite-sized cards (a plain-English
// idea on the front, an analogy on the back), and quick checks. Everything here stays faithful to
// the video and to the exact notes in content.ts, which remain on the page for anyone who wants them.
// Quick checks are not graded and pay nothing: the answer is shown straight away, so they are safe to
// ship to the browser. Points still come only from marking the lesson complete.
import { choice, fill, order, sort, spot, type Question } from "@/lib/question-types";
import type { IconName } from "@/lib/challenges";

export type Bite = { title: string; body: string; flip: string; icon: IconName };

export type LessonQuest = {
  hook: { ask: string; reveal: string };
  bites: Bite[];
  checks: Question[];
};

export const lessonQuests: Record<string, LessonQuest> = {
  "what-a-neural-network-is": {
    hook: {
      ask: "A computer has to read a handwritten 3, and there are endless ways to draw one. Would you write a rule for every shape, or teach it some other way?",
      reveal: "Nobody writes a rule per shape. The network learns from examples by adjusting numbers. This video shows what those numbers are and how they are arranged.",
    },
    bites: [
      { title: "Pixels are just numbers", body: "A handwritten digit is a 28×28 grid. Each pixel is a number for how bright it is, so the network starts with 784 numbers.", flip: "Picture a spreadsheet with 784 cells, each holding a brightness from dark to light.", icon: "eye" },
      { title: "Neurons hold a number", body: "Each neuron holds a number called its activation. Layers of neurons pass numbers forward: each layer is computed from the one before it.", flip: "A row of dimmer switches, where each switch’s brightness depends on the row behind it.", icon: "spark" },
      { title: "Weights say what matters", body: "Every connection has a weight, how strongly one neuron’s number pushes on the next. A bias is a nudge that sets how easily a neuron lights up.", flip: "A weight is a volume knob on one wire. The whole network has thousands of knobs.", icon: "target" },
      { title: "One big function", body: "Put it together and the network is one function: 784 numbers in, 10 numbers out, one per digit. The biggest output is the guess. The video’s example has about 13,000 weights and biases.", flip: "A machine with thousands of knobs and ten dials, one for each digit. The brightest dial is its answer.", icon: "puzzle" },
      { title: "Learning means turning the knobs", body: "You do not write a rule for each way to draw a 3. Learning means finding good settings for all those weights and biases from examples. The next lesson shows how.", flip: "Instead of writing the recipe, you taste, adjust, and taste again until it works.", icon: "bulb" },
    ],
    checks: [
      choice(
        "What goes into the digit network in this video, and what comes out?",
        [
          "A sentence goes in and a picture comes out.",
          "784 pixel brightness numbers go in and 10 numbers come out, one per digit.",
          "One number goes in and one number comes out.",
          "A digit label goes in and a drawing comes out.",
        ],
        1,
        "The image is 28×28 pixels, so 784 numbers go in. Ten numbers come out, one per digit, and the biggest is the guess.",
      ),
      sort(
        "Name that part: which description fits each term?",
        ["Holds a number", "How strongly one neuron pushes the next", "A nudge to how easily it lights up"],
        ["Activation", "Weight", "Bias"],
        [0, 1, 2],
        "An activation is the number a neuron holds. A weight scales a connection. A bias shifts how easily a neuron switches on.",
      ),
      order(
        "Follow the data through the network. Put the steps in order.",
        [
          "The biggest output number is the guess",
          "A 28×28 grid becomes 784 input numbers",
          "Each layer computes its numbers from the layer before",
          "Ten output numbers appear, one per digit",
        ],
        [1, 2, 3, 0],
        "Pixels in, layer by layer, ten outputs, and the biggest one is the answer.",
      ),
      spot(
        "Tap the line this video does NOT say.",
        [
          "Neurons hold activations computed from the previous layer.",
          "The whole network is one function from 784 numbers to 10.",
          "This video trains the network and works through backpropagation.",
          "Learning means changing weights and biases.",
        ],
        2,
        "This video does not train the network or derive backpropagation. That starts in the next lesson.",
        "Video",
      ),
    ],
  },

  "how-a-network-learns": {
    hook: {
      ask: "A hiker in thick fog wants to reach the valley floor. She can only feel the slope under her feet. What does she do?",
      reveal: "She steps in the direction that goes downhill fastest, then feels the slope again. That is gradient descent, where the “height” is how wrong the network is.",
    },
    bites: [
      { title: "It starts out bad", body: "A new network has weights that do not yet solve the task. It learns from examples that already come with the right answer attached.", flip: "A student guessing on the first practice test, then checking the answer key.", icon: "puzzle" },
      { title: "Cost means how wrong", body: "A cost function scores how far the network’s outputs are from the labels, averaged over the training examples. High cost is very wrong. Low cost is close.", flip: "One wrongness score, like golf: lower is better.", icon: "target" },
      { title: "The gradient points downhill", body: "The gradient says which way to nudge each weight and bias so the cost falls fastest.", flip: "The compass in the fog. It tells you the steepest way down.", icon: "compass" },
      { title: "Small steps, repeated", body: "Gradient descent nudges the weights a little, works out the gradient again, and repeats. It reaches a local low point, which is not a promise about images it has not seen.", flip: "Walking downhill in fog. You will reach a valley, maybe not the deepest one.", icon: "spark" },
      { title: "Backpropagation is the shortcut", body: "The efficient way to compute that gradient is backpropagation. This chapter explains why you need it and leaves the calculus for the next one.", flip: "A clever bookkeeping trick, so you do not have to test every knob one at a time.", icon: "bulb" },
    ],
    checks: [
      choice(
        "What is the cost function measuring?",
        [
          "How long training took.",
          "How far the network’s outputs are from the labels, averaged over the examples.",
          "How many neurons there are.",
          "How bright the image is.",
        ],
        1,
        "Cost is a single score for how wrong the network is across the labelled examples.",
      ),
      order(
        "Put one round of learning in order.",
        [
          "Nudge the weights and biases a little",
          "Compare the outputs with the labels to get a cost",
          "Show the network labelled examples",
          "Work out which way to nudge to cut the cost fastest",
        ],
        [2, 1, 3, 0],
        "Show examples, score the error, find the downhill direction, then take a small step. Then repeat.",
      ),
      sort(
        "Does gradient descent promise each of these?",
        ["Yes", "No"],
        [
          "Each step is a small change that lowers the cost",
          "It finds the single best possible settings",
          "It reaches a local low point",
          "It guarantees good results on images it has never seen",
        ],
        [0, 1, 0, 1],
        "It walks downhill to a local low point. It does not promise the best settings anywhere, or good results on unseen images.",
      ),
      fill(
        "Finish the sentence.",
        ["The ", " tells you which way to nudge each weight, so that the ", " falls as fast as possible."],
        [
          ["bias", "gradient", "label"],
          ["layer", "brightness", "cost"],
        ],
        [1, 2],
        "The gradient points the way, and the cost is the number you are trying to bring down.",
      ),
    ],
  },

  "large-language-models": {
    hook: {
      ask: "When a chatbot answers you, is it looking up a stored sentence somewhere, or doing something else?",
      reveal: "It is not looking up a page. It produces a likely continuation of the text, using patterns squeezed into a big file of numbers.",
    },
    bites: [
      { title: "Two files", body: "An LLM you run is two pieces: a parameters file (the numbers) and the code that runs it. It is not a database of sentences.", flip: "A music box: a small mechanism plus a huge programmed disc.", icon: "puzzle" },
      { title: "Compressed text", body: "Pretraining squeezes a very large amount of text into those parameters. The squeeze is lossy, so you get plausible text rather than a retrieved page.", flip: "Remembering the gist of a million books, not their pages.", icon: "eye" },
      { title: "The 2023 numbers", body: "The talk’s figures for Llama 2 70B: about 10TB of text, about 6,000 GPUs, about 12 days, about $2 million. It says frontier systems were already roughly ten times past that.", flip: "A reminder of why most organisations use a finished model instead of training their own.", icon: "trophy" },
      { title: "Fine-tuning is not truth", body: "Fine-tuning aims the model at assistant behaviour. It does not stop hallucination. An answer is more trustworthy when the needed text is in the context than when the model answers from parameters alone.", flip: "Open book beats from memory.", icon: "shield" },
      { title: "The model as a kernel", body: "The talk’s “LLM OS” picture: the model is like a kernel, the context window is working memory, and tools are peripherals.", flip: "The model thinks, the context is its desk, and tools are the printer and the internet.", icon: "compass" },
      { title: "Security is part of it", body: "The talk names jailbreaks, prompt injection and data poisoning. That list is from a November 2023 talk, not a full threat model.", flip: "Anything the model reads can try to steer it, so treat outside text with suspicion.", icon: "flame" },
    ],
    checks: [
      choice(
        "If the model file is not a database of sentences, what is it?",
        [
          "A list of every sentence it has ever seen.",
          "A file of parameters (numbers) plus code to run it.",
          "A copy of the whole internet.",
          "A set of rules written by engineers.",
        ],
        1,
        "It is a parameters file and the code that runs it. Training compressed text into those numbers.",
      ),
      sort(
        "Which situation makes an answer more trustworthy?",
        ["More trustworthy", "Less trustworthy"],
        [
          "The needed text is in the request",
          "The model answers from its parameters alone",
          "It browsed or retrieved the document first",
          "It is asked for an exact quote from memory",
        ],
        [0, 1, 0, 1],
        "The talk says an answer is more trustworthy when the needed text is in the context, from browsing or retrieval.",
      ),
      fill(
        "In the talk’s picture, complete the comparison.",
        ["The model is like a ", ", the context window is ", ", and tools are ", "."],
        [
          ["poster", "kernel", "printer"],
          ["working memory", "a hard drive", "the screen"],
          ["passwords", "fans", "peripherals"],
        ],
        [1, 0, 2],
        "Model as kernel, context window as working memory, tools as peripherals.",
      ),
      spot(
        "Tap the figure that is NOT from the talk.",
        [
          "About 10TB of text",
          "About 6,000 GPUs",
          "About 12 days of training",
          "About $2 billion for Llama 2 70B",
        ],
        3,
        "The talk’s figure for Llama 2 70B is about $2 million, and it notes frontier systems were already roughly ten times past that.",
        "Talk",
      ),
    ],
  },

  "what-generative-ai-is": {
    hook: {
      ask: "One model only labels photos “cat” or “dog”. Another writes a brand-new story about a cat. What is the difference?",
      reveal: "The first assigns a label. The second generates new content from patterns it learned. The second is generative AI.",
    },
    bites: [
      { title: "New content from patterns", body: "Generative AI produces new content (text, images, audio or synthetic data) from patterns it learned from existing content.", flip: "A chef inventing a dish after cooking thousands of recipes.", icon: "spark" },
      { title: "Prompt in, prediction out", body: "Training on existing content produces a statistical model. A prompt asks that model to predict a response, and that prediction is the new content.", flip: "Autocomplete, but for whole paragraphs, pictures or code.", icon: "prompt" },
      { title: "Where it sits", body: "The lesson places it in a stack: artificial intelligence, then machine learning, then deep learning, then generative models.", flip: "Like nesting dolls, each one inside the last.", icon: "puzzle" },
      { title: "More than a label", body: "That is different from a model that only assigns a label or a score to something.", flip: "A thermometer reports a number. A storyteller makes something new.", icon: "target" },
      { title: "Code is a use case", body: "The lesson names explaining code, translating it, writing SQL and drafting documentation.", flip: "Handy for the dull parts of a job: translating, explaining, documenting.", icon: "bulb" },
    ],
    checks: [
      choice(
        "What does the lesson say generative AI produces?",
        [
          "Only labels and scores.",
          "New content such as text, images, audio or synthetic data.",
          "Exact copies of its training data.",
          "Only code.",
        ],
        1,
        "It generates new content from patterns it learned, not just a label.",
      ),
      order(
        "Put these from the widest idea to the most specific.",
        ["Deep learning", "Generative models", "Artificial intelligence", "Machine learning"],
        [2, 3, 0, 1],
        "Artificial intelligence contains machine learning, which contains deep learning, which contains generative models.",
      ),
      sort(
        "Generative, or not?",
        ["Generative AI", "Not generative"],
        [
          "Writes a new product description",
          "Labels an email as spam or not spam",
          "Turns a prompt into a new image",
          "Gives a loan application a risk score",
        ],
        [0, 1, 0, 1],
        "Generating new content is generative. Assigning a label or score is a different kind of model.",
      ),
      fill(
        "Finish the definition.",
        ["A ", " asks the model to predict a ", ", and that prediction is the new content."],
        [
          ["password", "prompt", "invoice"],
          ["firewall", "refund", "response"],
        ],
        [1, 2],
        "A prompt asks the trained model to predict a response, and that response is the generated content.",
      ),
    ],
  },
};
