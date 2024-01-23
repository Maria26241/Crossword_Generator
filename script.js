'use strict';

/**
 * ICS4UC Final Project
 * 
 * Author: Julia McElrea
 * Description: Generate a crossword puzzle based on the input of words and hints.
 * 
 */


// MODEL
let ctx = canvas.getContext("2d");
let list = [];

// Class associated with each term, which is added to the list
class Term {
  word = "";            // Word
  hint = "";            // Hint associated with the word
  orientation = -1;     // Vertical (1) vs horizontal (0)
  in_crossword = false; // Used in crossword
  checked = false;      // Boolean deciding if the word is correct or not
  connected = [];       // 2D Array: location, word
  chosen = [];          // Array: location, word, U-D-MV-L-R-MH
  location = [];        // Location on canvas (x, y)
  input = [];           // User's input

  constructor(w, h, o) {
    this.word = w;
    this.hint = h;
    this.orientation = o;
  }

  // User got the word correct
  check() {
    let input_str = "";

    // Convert the array to a string
    for (let i = 0; i < input.length; i++)
      input_str += input[i];

    // The user got the word correct
    if (this.word == input_str) {
      this.checked = !this.checked;
      return true;
    }
    return false;
  }

  /* The term is placed in the crossword.
  *    Letter_loc: location of matching letter
  *    Word: Word it's connecting  */
  placed(letter_loc, word, how) {
    this.in_crossword = !this.in_crossword;
    this.chosen = [letter_loc, word, how];
  }

  // Loop through the letters in use, where loc is the placed word, and quest is the location of the letter in question (i_placed)
  used(ltr, word) {
    for (let i = 0; i < this.connected.length; i++) {
      if (((this.connected[i][0] == ltr) && (this.connected[i][1] == word)) || ((this.connected[i][0] == word) && (this.connected[i][1] == ltr))) {
        return true;
      }
    }
    return false;
  }
}

//let temp = [new Term("Supercalifragilisticexpialidocious", "Mary Poppins"), new Term("Cow", "it moos"), new Term("whatsapp", "an application"), new Term("dubadee", "something funny")]; // DELETE LATER

// EVENT LISTENERS 
$("start_btn").addEventListener("click", main);
$("help_btn").addEventListener("click", instructions);
$("add_btn").addEventListener("click", add_to_array);
$("del_btn").addEventListener("click", remove);
$("submit_btn").addEventListener("click", check_crossword);
$("replay_btn").addEventListener("click", replay);
$("canvas").addEventListener("click", box_select);
//$("canvas").addEventListener("onkeypress", text);


// CONTROLLER

// Function shortcut
function $(id) {
  return document.getElementById(id);
}


// Add the input to the array as a word and hint
function add_to_array() {
  let word = "";
  let hint = "";
  let hint_check = "";
  let input = $("word_n_hint").value;
  let space = 0;

  // Determine word versus hint in input
  for (let i = 1; i < input.length; i++) {
    if ($("word_n_hint").value[i] == " ") {
      space = i;
      break;
    }
  }

  // Separate the word from the hint and put them in variables
  for (let w = 0; w < space; w++) {
    word += input[w];
  }
  for (let h = space + 1; h < input.length; h++) {
    hint += input[h]
  }

  // Trim the spaces from before and after
  word = word.trim();
  hint = hint.trim();

  // For checking purposes
  for (let h = 0; h < hint.length; h++) {
    if (hint[h] != " ")
      hint_check += hint[h];
  }

  // Check if a word or hint is missing
  if ((word == "") || (hint_check == "")) {
    return error("four_oh_four");
  }

  // For Loop that checks to see if a word or hint was used already
  for (let i in list) {
    if ((list[i].word.toLowerCase() == word.toLowerCase()) || (list[i].hint.toLowerCase() == hint.toLowerCase())) {
      return error("invalid_term");
    }
  }

  // Add a term to the list
  list.push(new Term(word, hint));

  // Redirects user's focus on the emptied input
  $("word_n_hint").value = "";
  $("word_n_hint").focus();

  update_list("before_crossword");
}

// Functions the various errors
function error(assignment) {
  if (assignment == "invalid_term") {
    $("word_n_hint").value = "";
    $("word_n_hint").placeholder = "Word or Hint used already!";
    $("word_n_hint").focus();
  } else if (assignment == "four_oh_four") {
    $("word_n_hint").value = "";
    $("word_n_hint").placeholder = "Something is missing!";
    $("word_n_hint").focus();
  } else if (assignment == "not_enough_terms") {
    $("word_n_hint").value = "";
    $("word_n_hint").placeholder = "Minimum of one term required!";
    $("word_n_hint").focus();
  }
}


// Take out the most recent word from the list
function remove() {
  let input = $("word_n_hint").value.toLowerCase().trim();

  // Loop through the list if the input matches one of the list items to remove it
  for (let i in list) {
    let combo = (list[i].word + " " + list[i].hint).toLowerCase().trim();
    if ((list[i].word.toLowerCase() == input) || (list[i].hint.toLowerCase() == input) || (combo == input)) {
      list.splice(i, 1);
      update_list("before_crossword");
      return;
    }
  }
  list.pop();
  update_list("before_crossword");
}


// Display the instructions
function instructions() {
  if ($("instructions_txt").hidden == true) {
    $("instructions_txt").hidden = false;
  } else {
    $("instructions_txt").hidden = true;
  }
}


// Adjust the instructions once the player begins playing
function adjust_instructions(condition) {
  if (condition == "Start") {
    $("instructions_txt").innerHTML = `
  <b> How to Play (Adjusts once you press "Submit!")</b>
    <br>
    <ul>
      <li>
        CLICK a box OR one of the hints to direct you to the next available box for the corresponding word.
      </li>
      <li> Enter the letters you believe fit the boxes. </li>
      <li> Press "Submit" once all the boxes are filled! A report on your stats for the game will be displayed! </li>
    </ul>
  `;
  } else {
    $("instructions_txt").innerHTML = `
    <b> How to Play (Adjusts once you press "Replay!")</b>
      <br>
      <ul>
        <li>
          Your points should appear...
        </li>
        <li> Take a screenshot to save your results! (NOT a button here!) </li>
        <li> Press "Replay" when you're ready to play again! (Window refresh!) </li>
      </ul>
    `;
  }
  
}


// Determine the number of possible matches per word in the list
function num_of_matches() {
  // Loop through list for words
  for (let i = 1; i < list.length - 1; i++) {
    // Loop through other list of words
    for (let x in list) {
      // Loop through the letters of the first word
      for (let ltrs_i = 0; ltrs_i < list[i].length; ltrs_i++) {
        // Loop through the letters of the second word
        for (let ltrs_x = 0; ltrs_x < list[x].word.length; ltrs_x++) {
          // Check if there is a match.  Add the matches to the terms.
          if ((list[i].word[ltrs_i] == list[x].word[ltrs_x]) && (list[i] != list[x]) && (!list[i].used(ltrs_i, list[x]))) {
            list[i].connected.push([ltrs_i, list[x]]);
            list[x].connected.push([ltrs_x, list[i]]);
          }
        }
      }
    }
  }
  return;
}


/**
 * Returns a sorted array (longest to shortest) utilizing the Insertion Sort method
 *
 * @param {Array} unsortedArray The data to be sorted
 * @param {boolean} debug Whether or not to print debug information
 * @return {Array} A sorted copy of the given unsortedArray
 */
function insertSort(unsortedArray) {
  num_of_matches();
  // A copy of the given array (so we don't destroy the original)
  let data = Array.from(unsortedArray);

  let temp; // Current Item
  let loc;

  for (let a = 1; a < data.length; a++) { // Loop through the unsorted data
    temp = data[a];
    if (data[a - 1].connected.length < temp.connected.length) {
      for (let b = a - 1; (b >= 0) && (data[b].connected.length < temp.connected.length); b--) {
        data[b + 1] = data[b];
        loc = b;
      }
      data[loc] = temp;
    }
  }
  return data;
}


// The user presses "Start" and the crossword gets generated
function main() {
  //list = [new Term("an", "Article"), new Term("nice", "Pretty, cool"), new Term("ill", "Sick, unwell"), new Term("ivory", "Tusks and teeth are made out of this")]; // DELETE LATER

  adjust_instructions("Start");

  // The list is not long enough
  if (list.length <= 1) {
    return error("not_enough_terms");
  }

  // Update the list to be sorted by the number of connections
  list = insertSort(list);
  console.log("List:", list);

  // Place the word with the most connections and let it be horizontal
  list[0].placed("start");
  list[0].orientation = 0; // Eventually make this a random number (0, 1)
  list[0].location = [[0, 0]]; // Adjust to correspond to random number
  create_box(list[0]);

  // DELETE LATER - create a vertical one
  // list[1].orientation = 1;
  // list[1].location = [[0, 1]];
  // create_box(list[1]);

  // list[3].orientation = 0;
  // list[3].location = [[2, 2]];
  // create_box(list[3]);

  // Place each word one by one from least amount of connections to most  CAREFUL FOR COLLISIONS
//   for (let i = list.length - 1; i >= 0; i--) {
//     // Must have minimum one connection - deal with zero connections AFTER
//     if (list[i].connected.length > 0) {
//       // Loop through the connections
//       for (let x = 0; x < list[i].connected.length; x++) {
//         console.log("List length:", list[i].word, list[i].connected.length);
//         // Loop through connections for invalid placements
        



        
//       }
//     }

//   }
  update_list("make_crossword");
}


// Create boxes for the word and connection  ELONGATE CANVAS IF NEEDED
function create_box(list_loc) {
  // Find the point (0, 0)  DELETE LATER
  ctx.beginPath();
  ctx.rect(0, 0, 1, 1);
  ctx.stroke();


  console.log("X:", list_loc.location[0][0], "Y:", list_loc.location[0][1]);


  // For loop creating boxes for the length of the word
  for (let i = 0; i < list_loc.word.length; i++) {
    if (list_loc.orientation == 0) { // Horizontal
      // Extend the canvas width if it's not wide enough
      if (canvas.width < (list_loc.word.length + list_loc.location[0][1]) * 50) {
        let temp_drawing = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width += ((list_loc.word.length + list_loc.location[0][1]) * 50) - 50;
        ctx.putImageData(temp_drawing, 0, 0);
      }

      // Create a box
      ctx.strokeRect(((list_loc.location[0][1] + i) * 50), (list_loc.location[0][0] * 50), 50, 50);

      // Create an input for the box
      $("inputs").innerHTML += `<input type="text" id="I${i}" placeholder="Letter">`;

      // Setting the location
      if (i > 0) {
        list_loc.location.push([i, list_loc.location[0][1]]);
      }


    } else {  // Vertical
      // Extend the canvas height if it's not tall enough
      if (canvas.height < (list_loc.word.length + list_loc.location[0][0]) * 50) {
        let temp_drawing = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.height += ((list_loc.word.length + list_loc.location[0][0]) * 50) - 50;
        ctx.putImageData(temp_drawing, 0, 0);
      }

      // Create a box
      ctx.strokeRect((list_loc.location[0][1] * 50), ((list_loc.location[0][0] + i) * 50), 50, 50);

      // Setting the location
      if (i > 0) {
        list_loc.location.push([list_loc.location[0][1], i]);
      }
    }
  }
  console.log("List Loc.:", list_loc, list_loc.location);
}


// User clicks a box and it identifies the 'x' and 'y' coordinates
function box_select(event) {
  let x = Math.floor((event.clientX - 18) / 50);
  let y = Math.floor((event.clientY - 281) / 50);
  console.log("Event:", event.clientX, event.clientY);
  console.log(x, y);

}

//onkeypress
function text(event) {
  console.log(event, event.Target.id);
  let x = Math.floor((event.clientX - 18) / 50);
  let y = Math.floor((event.clientY - 281) / 50);

  // ctx.font = "30px Arial";
  // ctx.fillText("Hello World", x + 5, y + 5);

}


// Counts the points earned per correct word once the crossword is complete
function check_crossword() {
  let pts = 0;  
  
  for (let i in list) {
    if (list[i].check())
      pts++;
  }
  update_list("submit_crossword");
  return pts;
}


// Refresh the window to replay the game
function replay() {
  location.reload();
}


// Correlates list to HTML beginning BEFORE Crossword is generated
function update_list(condition) {
  if (condition == "before_crossword") {
    // Resets the label and list of words
    $("word_n_hint").innerHTML = "";
    $("word_n_hint").placeholder = "Gimme something!";
    $("words_list").innerHTML = "";

    // Updates the list of words and hints
    for (let i in list) {
      $("words_list").innerHTML += list[i].word + " " + list[i].hint + "<br>";
    }
  } else if (condition == "make_crossword") {
    // Hide/show necessary elements
    $("crossword_puzzle").hidden = false;
    $("start_btn").hidden = true;
    $("add_btn").hidden = true;
    $("del_btn").hidden = true;
    $("submit_btn").hidden = false;
    $("user_input").hidden = true;
    
    // Output the hints for the corresponding orientation
    $("across").innerHTML = `<h3> Across </h3> <ol>`;
    $("down").innerHTML = `<h3> Down </h3> <ol> `;

    for (let i in list) {
      if (list[i].orientation == 0) {  // Horizontal hints
        $("across").innerHTML += `<li id="A${i}"> ${list[i].hint} </li>`
      } else {  // Vertical hints
        $("down").innerHTML += `<li id="D${i}"> ${list[i].hint} </li>`
      }
    }

    $("across").innerHTML += `</ol>`;
    $("down").innerHTML += `</ol>`;
  } else if (condition == "submit_crossword") {
    // Hide necessary button
    $("submit_btn").hidden = true;
    $("replay_btn").hidden = false;

    // Re-adjust the instructions
    adjust_instructions("Submit");
  }
}


