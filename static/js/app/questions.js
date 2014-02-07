
var selectedAnswer = 0;

//var mainLayer = new Kinetic.Layer();

function set_cursor(value) {
    //auto        move           no-drop      col-resize
    //all-scroll  pointer        not-allowed  row-resize
    //crosshair   progress       e-resize     ne-resize
    //default     text           n-resize     nw-resize
    //help        vertical-text  s-resize     se-resize
    //inherit     wait           w-resize     sw-resize
    document.body.style.cursor = value;
}

function createStatisticsLegend(diagram)
{
	var legend = new arEasel.StatisticsLegend(diagram);
	return legend;
}

function createStatisticsEquations(diagram)
{
	
	var eqn = new arEasel.layoutEquation(diagram);
	return eqn;

}

function createDaigram(data){

	 var diagram = null;
	 if (data.name === "Tree Diagram"){
		diagram =  new arEasel.TreeDiagram(data);
	 }else if (data.name === "Venn Diagram"){
		diagram =  new arEasel.VennDiagram(data);
	 }else if (data.name === "Partition Diagram"){
		diagram =  new arEasel.PartitionDiagram(data.children);
	 }else if (data.name === "Sankey Diagram"){
		diagram =  new arEasel.SankeyDiagram(data.graph);
	 }
	 return diagram;
}

function createAnswers(parentGroup, choices, clickCallback ){
	var answer_inputCount = 0;
	if (choices.input){
		var answerGroup = new createjs.Container();
		for (var i=0; i < choices.input.length; i++){
		
			if (choices.input[i] === "|input|"){
				answer_inputCount++;
				var form = $('#mainForm');
				$('<input type="text" id="answer_input'+answer_inputCount.toString()+'" name="answer_input'+answer_inputCount.toString()+'" value="" style="width: 100px; height:20px;" />').appendTo(form);
				var domElement = new createjs.DOMElement("answer_input"+answer_inputCount.toString());
				domElement.width = 100;
				domElement.height = 20;
				var shape = new createjs.Shape();
				shape.width = 100;
				shape.height = 20;
				shape.graphics.s("#CCC").drawRect(0, 0, shape.width, shape.height);
				answerGroup.addChild(shape);
				answerGroup.addChild(domElement);
				
			}else{
				var questionCount = new createjs.Text(choices.input[i], "16px Arial", "#000");
				answerGroup.addChild(questionCount);
			}
		}
		arEasel.gridLayout(answerGroup, {hLayout: true, hSpace: 10});
		parentGroup.addChild(answerGroup);
		
	} else if (jQuery.type( choices) === "array"){
		for (var i=0; i < choices.length; i++){
			//var newY = ((prev_text != null) ? prev_text.y + prev_text.getMeasuredHeight() + vertSpacing : 0);
			var choice = new arEasel.RadioButton(choices[i], arEasel.style.RadioButtonSyle);
			choice.addEventListener("click", clickCallback);
			parentGroup.addChild(choice);
			//prev_text = choice;
			
			
		}
	}else {
		for (var k in choices) {
			for (var i=0; i < choices[k].length; i++){
				//var newY = ((prev_text != null) ? prev_text.y + prev_text.getMeasuredHeight() + vertSpacing : 0);
				var choice = new arEasel.RadioButton(k+", "+choices[k][i], arEasel.style.RadioButtonSyle);
				//choice.x = 0;
				//choice.y = newY;
				choice.addEventListener("click", clickCallback);
				parentGroup.addChild(choice);
				//prev_text = choice;
			}
		}
	}
	
	return answer_inputCount;
}


/*

    function createBarGraph(parentGroup, pos, data)
    {
        // data is in format [{name, value}, {name, value}]

        var rect = new Kinetic.Rect({x:pos.x,y:pos.y,width:110, height: 20, fill:'white', stroke:'black'});

        var total = data[0].value + data[1].value
        var percent1 = data[1].value/total;
        //var percent2 = data[1].value/total;

        var rect1 = new Kinetic.Rect({x:pos.x,y:pos.y,width:110*percent1, height: 20, fill:'black'});
        var text1 = new Kinetic.Text({x:pos.x-60,y: pos.y+6, fontSize: 12, fontFamily: 'sans-serif',  fill: '#000', width: 55, padding: 0, lineHeight: 1, align: 'right',
                                          text: data[1].value + " " + data[1].name,});
        var text2 = new Kinetic.Text({x:pos.x+115,y: pos.y+6, fontSize: 12, fontFamily: 'sans-serif',  fill: '#000', width: 55, padding: 0, lineHeight: 1, align: 'left',
                                          text: data[0].value + " " + data[0].name,});

        parentGroup.add(rect);
        parentGroup.add(rect1);
        parentGroup.add(text1);
        parentGroup.add(text2);
    }

    function createAnswer(parentGroup, choiceName, consequences ){
      var itemHeight = 30;
      
      var anserwerGroup = new Kinetic.Group({height: consequences.length * itemHeight});

      // Choice
      var choice1Group = new Kinetic.Group({height: itemHeight});
      var rect1 = new Kinetic.Rect({x:0,y:0,width:110, height: itemHeight, fill:'white'});
      var circleChoice1 = new Kinetic.Circle({x: 5, y: 7, radius: 10, stroke: '#ccc', strokeWidth: 1, fillRadialGradientStartPoint: 0, fillRadialGradientStartRadius: 0, fillRadialGradientEndPoint: 0, fillRadialGradientEndRadius: 10, fillRadialGradientColorStops: [0, 'white', 0.5, 'white', 1, '#777']});
      
      
      var choice1Text = new Kinetic.Text({x: 20,y: 0, fontSize: 16, fontFamily: 'sans-serif',  fill: '#000', width: 100, padding: 0, lineHeight: 1, align: 'left',
                                          text: choiceName,});

      choice1Group.add(rect1);
      choice1Group.add(circleChoice1);
      choice1Group.add(choice1Text);

      // Consequences

      var ConsequencesGroup = new Kinetic.Group({height: consequences.length * itemHeight});

      var startX = 100; var startY = 7;
      var totalHeight = consequences.length * itemHeight;
      var ConsequanceLines = [];
      var ConsequanceCircles = [];

      for (var i=0; i < consequences.length; i++){
        var yOffest = (consequences.length > 1) ? (-totalHeight/2) + (itemHeight * (i+1)) : startY; 
        var circleConsequence1 = new Kinetic.Circle({x: startX+100, y: yOffest, radius: 10, stroke: '#ccc', strokeWidth: 1, fillRadialGradientStartPoint: 0, fillRadialGradientStartRadius: 0, fillRadialGradientEndPoint: 0, fillRadialGradientEndRadius: 10, fillRadialGradientColorStops: [0, 'white', 0.5, 'white', 1, '#777']});
        var points = [startX+10, 8, startX+80, yOffest];

        var line1 = new Kinetic.Line({points: points, stroke: 'black', strokeWidth: 6*consequences[i].probability, lineCap: 'round', lineJoin: 'round'});
        var text = new Kinetic.Text({x: startX+120, y: yOffest-8, fontSize: 16, fontFamily: 'sans-serif',  fill: '#000', width: 220, padding: 0, lineHeight: 1, align: 'left',
                                          text: (consequences[i].probability* 100) + "% Probability",});
        ConsequanceLines.push(line1);
        ConsequanceCircles.push(circleConsequence1);

        ConsequencesGroup.add(circleConsequence1);
        ConsequencesGroup.add(line1);
        ConsequencesGroup.add(text);

        createBarGraph(ConsequencesGroup, {x: startX+70+text.getWidth()+5, y: yOffest-8} ,[{name: "live",value: consequences[i].live},{name: "die",value: consequences[i].die}]);
        
      }

      var selectedStops = [0, '#2C4EBF', 0.6, 'white', 1, '#777'];
      var regularSteps = [0, 'white', 0.5, 'white', 1, '#777'];
      var hoverStops = [0, '#83ADCC', 0.6, 'white', 1, '#777'];
      var hoverSelectedStops = [0, '#2C82BF', 0.6, 'white', 1, '#777'];
      
      choice1Group.on('mouseover touchstart', function() {
          circleChoice1.setFillRadialGradientColorStops((selectedAnswer == choiceName) ? hoverSelectedStops : hoverStops);
         
          for (var i=0; i < consequences.length; i++){
            ConsequanceLines[i].setStrokeWidth(8*consequences[i].probability);
            ConsequanceCircles[i].setFillRadialGradientColorStops((selectedAnswer == choiceName) ? hoverSelectedStops : hoverStops);
          }

          ConsequencesGroup.setScale(1.05, 1.05);

          choice1Text.setFontStyle('bold');
          set_cursor("pointer");
          mainLayer.draw();
      });
     

      choice1Group.on('mouseout touchend', function() {
          // set multiple properties at once with setAttrs
          circleChoice1.setFillRadialGradientColorStops((selectedAnswer == choiceName) ? selectedStops : regularSteps);
          for (var i=0; i < consequences.length; i++){
            ConsequanceLines[i].setStrokeWidth(6*consequences[i].probability);
            ConsequanceCircles[i].setFillRadialGradientColorStops((selectedAnswer == choiceName) ? selectedStops : regularSteps);
          }
          ConsequencesGroup.setScale(1.0, 1.0);
          choice1Text.setFontStyle('normal');
          set_cursor("default");
          mainLayer.draw();
        });
      
      anserwerGroup.add(choice1Group);
      anserwerGroup.add(ConsequencesGroup);

      parentGroup.add(anserwerGroup);
      return {group: anserwerGroup, 
              select: function() { circleChoice1.setFillRadialGradientColorStops(selectedStops); 
                for (var i=0; i < consequences.length; i++){
                    ConsequanceCircles[i].setFillRadialGradientColorStops(selectedStops);
                }
                selectedAnswer = choiceName;
              },
              unselect: function() { circleChoice1.setFillRadialGradientColorStops(regularSteps); 
                for (var i=0; i < consequences.length; i++){
                    ConsequanceCircles[i].setFillRadialGradientColorStops(regularSteps);
                }
                selectedAnswer = 0;
              }
             };
    }

 */
 
 /*
    var question1 = { question: [{type: "p", text: "Imagine that the U.S. is preparing for the outbreak of an unusual Asian disease, which is expected to kill 600 people. Two alternative programs to combat the disease have been proposed. Assume that the exact scientific estimate of the consequences of the programs are as follows:"},
                             {type: "li", text: "If Program A is adopted, 200 people will be saved."},
							 {type: "li", text: "If Program B is adopted, there is 1/3 probability that 600 people will be saved, and 2/3 probability that no people will be saved."},
							 {type: "p", text: "Which of the two programs would you favor?" }
							 ], 
                  answers: [{choice:"Program A", consequence: {probability: 1.0, result:[{live: 200},{die:400}]}},
                            {choice:"Program B", consequence: [{probability: 0.33, result:[{live: 600},{die:0}]}, {probability: .66, result:[{live: 0}, {die:600}]}]}
                           ]
                 };
	var question2 = { question: [{type: "p", text: "Choose between"}], 
                  answers: [{choice:"Option A", consequence: {probability: 1.0, result:[{gain: 240}, {lose:750}]}},
                            {choice:"Option B", consequence: [{probability: 0.25, result:[{gain: 1000}, {lose:0}]}, {probability: .75, result:[{gain: 0}, {lose:100}]}]}
                           ]
                 };
	var question3 = { question: [{type: "p", text: "Which of the following options do you prefer?"}], 
                  answers: [{choice:"Option A", consequence: {probability: 1.0, result:[{win: 30}, {lose:0}]}},
                            {choice:"Option B", consequence: [{probability: 0.80, result:[{win: 45}, {lose:0}]}, {probability: .20, result:[{win: 0}, {lose:0}]}]}
                           ]
                 };
	var question4 = { question: [{type: "p", text: "Consider the following two-stage game. In the first stage, there is a 75% chance to end the game without winning anything, and a 25% chance to move into the second stage. If you reach the second stage you have a choice between:"},
								{type: "p", text: "Your choice must be made before the game starts, i.e., before the outcome of the first stage is known. Please indicate the option you prefer."}
								], 
                  answers: [{choice:"Option A", consequence: {probability: 1.0, result:[{win: 30}, {lose:0}]}},
                            {choice:"Option B", consequence: [{probability: 0.80, result:[{win: 45}, {lose:0}]}, {probability: .20, result:[{win: 0}, {lose:0}]}]}
                           ]
                 };
	var question5 = { question: [{type: "p", text: "Imagine that you have decided to see a play where admission is $10 per ticket. As you enter the theater you discover that you have lost a $10 bill."},
								{type: "p", text: "Would you still pay $10 for a ticket for the play?"}], 
                  answers: [{choice:"Yes"},
                            {choice:"No"}
                           ]
                 };
	
	var question5 = {};
	*/

   