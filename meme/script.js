function clearAll() {

  const memeContainer = document.querySelector('.meme-content');
  const jokeContainer = document.querySelector('.joke-content');
  const qouteContainer = document.querySelector('.qoute-content');
  const riddleContainer = document.querySelector('.riddle-content');

  memeContainer.innerHTML = '';
  jokeContainer.innerHTML = '';
  qouteContainer.innerHTML = '';
  riddleContainer.innerHTML = '';

}

// Function to get a random meme
function showMeme() {
  const randomMemeUrl = getRandomData("memes");
  const container = document.querySelector('.meme-content');
  const newImg = document.createElement('img');
  newImg.setAttribute('src', randomMemeUrl);
  clearAll();
  container.appendChild(newImg);
}

function showJoke() {
  const randomJokeText = getRandomData("jokes");
  const container = document.querySelector('.meme-content');
  const newJoke = document.createElement('p');
  newJoke.textContent = randomJokeText;
  clearAll();
  container.appendChild(newJoke);
}

function showQuote() {

  const randomQuote = getRandomData("quotes");
  const container = document.querySelector('.qoute-content');

  const newAuthor = document.createElement('p');
  const newQoute = document.createElement('p');

  newQoute.textContent = randomQuote.quote;
  newAuthor.textContent = "- " + randomQuote.author;
  clearAll();

  container.appendChild(newQoute);
  container.appendChild(newAuthor);

}

function showRiddle() {

  const randomRiddle = getRandomData("riddles");

  const { question, answer } = randomRiddle;

  const questionElem = document.createElement('p');
  questionElem.textContent = question;

  const answerElem = document.createElement('p');
  answerElem.textContent = 'The answer is :- ' + answer;
  answerElem.setAttribute('id', 'riddle-answer');

  answerElem.hidden = true;

  const container = document.querySelector('.riddle-content');

  clearAll();

  container.appendChild(questionElem);
  container.appendChild(answerElem);
}

function revealAnswers() {

  const riddleContent = document.querySelector(".riddle-content");
  const riddle = riddleContent.querySelector("p");
  const riddleAnswer = document.querySelector("#riddle-answer");

  if (riddle && riddleAnswer.hidden) {
    riddleAnswer.hidden = false;
  } else if (riddle && riddleAnswer) {
    alert("The riddle answer is already exposed!");
  } else {
    alert("There is no riddle to show the answer for!");
  }
}

// Dynamically generate the list of meme file paths
const memes = [];
for (let i = 1; i <= 20; i++) {
  memes.push(`./memes/meme (${i}).jpg`);
}

// Function to get random data from the predefined list
function getRandomData(type) {
  return data[type][rn(data[type].length)];
}

// Helper function to generate a random number
function rn(len) {
  return Math.floor(Math.random() * len);
}

const jokes = [
  "This statement",
  "Eight bytes walk into a bar.  The bartender asks, “Can I get you anything?” “Yeah,” reply the bytes.  “Make us a double.”",
  "There are only 10 kinds of people in this world: those who know binary and those who don’t.",
  "All programmers are playwrights, and all computers are lousy actors.",
  "Have you heard about the new Cray super computer?  It’s so fast, it executes an infinite loop in 6 seconds.",
  "The generation of random numbers is too important to be left to chance.",
  "Debugging: Removing the needles from the haystack.",
  "“Debugging” is like being the detective in a crime drama where you are also the murderer.",
  "There are two ways to write error-free programs; only the third one works.",
  "The best thing about a Boolean is even if you are wrong, you are only off by a bit.",
];

const quotes = [
  {
    quote:
      "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
  },
  {
    quote:
      "Programming today is a race between software engineers striving to build bigger and better idiot-proof programs, and the Universe trying to produce bigger and better idiots. So far, the Universe is winning.",
    author: "Rick Cook",
  },
  {
    quote:
      "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live",
    author: "John Woods",
  },
  {
    quote:
      "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
  },
  {
    quote: "Truth can only be found in one place: the code.",
    author: "Robert C. Martin",
  },
  {
    quote:
      "That's the thing about people who think they hate computers. What they really hate is lousy programmers.",
    author: "Larry Niven",
  },
  {
    quote:
      "You've baked a really lovely cake, but then you've used dog shit for frosting.",
    author: "Steve Jobs",
  },
  {
    quote:
      "A language that doesn't affect the way you think about programming is not worth knowing.",
    author: "Alan J. Perlis",
  },
  {
    quote:
      "The most disastrous thing that you can ever learn is your first programming language.",
    author: "Alan Kay",
  },
  {
    quote:
      "The computer programmer is a creator of universes for which he alone is the lawgiver. No playwright, no stage director, no emperor, however powerful, has ever exercised such absolute authority to arrange a stage or field of battle and to command such unswervingly dutiful actors or troops.",
    author: "Joseph Weizenbaum",
  },
  {
    quote:
      "Everyone knows that debugging is twice as hard as writing a program in the first place. So if you're as clever as you can be when you write it, how will you ever debug it?",
    author: "Brian Kernighan",
  },
  {
    quote:
      "No matter which field of work you want to go in, it is of great importance to learn at least one programming language.",
    author: "Ram Ray",
  },
];

const riddles = [
  {
    question:
      "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    answer: "An echo",
  },
  {
    question:
      "You measure my life in hours and I serve you by expiring. I’m quick when I’m thin and slow when I’m fat. The wind is my enemy. ",
    answer: "A Candle",
  },
  {
    question:
      "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I? ",
    answer: "A Map",
  },
  {
    question:
      "What is seen in the middle of March and April that can’t be seen at the beginning or end of either month?",
    answer: 'The letter "R"',
  },
  {
    question:
      "You see a boat filled with people. It has not sunk, but when you look again you don’t see a single person on the boat. Why?",
    answer: "All the people were married",
  },
  {
    question:
      "What word in the English language does the following: the first two letters signify a male, the first three letters signify a female, the first four letters signify a great, while the entire world signifies a great woman. What is the word?",
    answer: "Heroine",
  },
];

// Data object to store all predefined lists
const data = {
  memes,
  jokes,
  quotes,
  riddles,
};