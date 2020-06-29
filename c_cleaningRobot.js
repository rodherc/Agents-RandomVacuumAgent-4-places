/* The general structure is to put the AI code in xyz.js and the visualization
   code in c_xyz.js. Create a diagram object that contains all the information
   needed to draw the diagram, including references to the environment&agents.
   Then use a draw function to update the visualization to match the data in
   the environment & agent objects. Use a separate function if possible for 
   controlling the visualization (whether through interaction or animation). 
   Chapter 2 has minimal AI and is mostly animations. */

const SIZE = 100;
const colors = {
    perceptBackground: 'hsl(240,10%,85%)',
    perceptHighlight: 'hsl(60,100%,90%)',
    actionBackground: 'hsl(0,0%,100%)',
    actionHighlight: 'hsl(150,50%,80%)'
};


/* Create a diagram object that includes the world (model) and the svg
   elements (view) */
function makeDiagram(selector) {
    let diagram = {}, world = new World(4);
    diagram.world = world;
    // % 2 para manter no intervalo de 2 para manter os floors alinhados
    diagram.xPosition = (floorNumber) => 150 + (floorNumber%2) * 600 / diagram.world.floors.length;
    diagram.yPosition = (floorNumber) => {
        // Os 2 floor de cima
        if (floorNumber < 2) {return 200;}
        // Os 2 floor de baixo
        else {return 400;}
    }
    diagram.root = d3.select(selector);
    diagram.robot = diagram.root.append('g')
        .attr('class', 'robot')
        .style('transform', `translate(${diagram.xPosition(world.location)}px,100px)`);
    diagram.robot.append('rect')
        .attr('width', SIZE)
        .attr('height', SIZE)
        .attr('fill', 'hsl(120,25%,50%)');
    diagram.perceptText = diagram.robot.append('text')
        .attr('x', SIZE/2)
        .attr('y', -25)
        .attr('text-anchor', 'middle');
    diagram.actionText = diagram.robot.append('text')
        .attr('x', SIZE/2)
        .attr('y', -10)
        .attr('text-anchor', 'middle');

    diagram.floors = [];
    
    for (let floorNumber = 0; floorNumber < world.floors.length; floorNumber++) {
        diagram.floors[floorNumber] =
            diagram.root.append('rect')
            .attr('class', 'clean floor') // for css
            .attr('x', diagram.xPosition(floorNumber))
            .attr('y', diagram.yPosition(floorNumber))
            .attr('width', SIZE)
            .attr('height', SIZE/4)
            .attr('stroke', 'black')
            .on('click', function() {

                /*  retorna um número inteiro entre dois valores definidos. 
                    O valor não poderá ser menor que min (ou do próximo inteiro maior que min, 
                    caso min não seja inteiro), e será menor (mas não igual) a max.    */
                let min = Math.ceil(0);
                let max = Math.floor(1);
                let random =  Math.floor(Math.random() * (max - min + 1)) + min;

                // Se for 0 piso é marcado como Dirty
                if(!random){
                    world.markFloorDirty(floorNumber);
                    diagram.floors[floorNumber].attr('class', 'dirty floor');
                }
                // Se for 1 piso é marcado como Dirty2
                else{
                    world.markFloordirty2(floorNumber);
                    diagram.floors[floorNumber].attr('class', 'dirty2 floor');
                   
                    random =  Math.floor(Math.random() * (max - min + 1)) + min;

                    //Chance de marcar mais um piso aleatóriamente como Dirty2
                    if(!random){
                        max = Math.floor(4);
                        random =  Math.floor(Math.random() * (max - min + 1)) + min;
                        // Se o floor na posicao random já estiver sujo, não se faz nada
                        if(!world.floors[random].dirty || !world.floors[random].dirty2 ){
                            world.markFloordirty2(random);
                            diagram.floors[random].attr('class', 'dirty2 floor');
                        }
                    }
                }
            });
    }
    return diagram;
}


/* Rendering functions read from the state of the world (diagram.world) 
   and write to the state of the diagram (diagram.*). For most diagrams
   we only need one render function. For the vacuum cleaner example, to
   support the different styles (reader driven, agent driven) and the
   animation (agent perceives world, then pauses, then agent acts) I've
   broken up the render function into several. */
function renderWorld(diagram) {
    for (let floorNumber = 0; floorNumber < diagram.world.floors.length; floorNumber++) {
        diagram.floors[floorNumber].attr('class', diagram.world.floors[floorNumber].dirty? 'dirty floor' : 'clean floor');
        if(!diagram.world.floors[floorNumber].dirty)
            diagram.floors[floorNumber].attr('class', diagram.world.floors[floorNumber].dirty2? 'dirty2 floor' : 'clean floor');
    }
    diagram.robot.style('transform', `translate(${diagram.xPosition(diagram.world.location)}px,${diagram.yPosition(diagram.world.location) - 110}px`);
}

// Renderiza o Label 1 do robot
function renderAgentPercept(diagram, dirty, dirty2) {
    let perceptLabel = {false: "It's clean", true: "It's dirty"}[dirty];

    if(perceptLabel == "It's clean"){
        perceptLabel = {false: "It's clean", true: "It's dirty2"}[dirty2];
    }

    diagram.perceptText.text(perceptLabel);
}

// Renderiza o Label 2 do robot
function renderAgentAction(diagram, action) {
    let actionLabel = {null: 'Waiting', 'SUCK': 'Vacuuming', 'SUCK2': 'Vacuuming','LEFT': 'Going left', 'RIGHT': 'Going right', 'UP': 'Going up', 'DOWN': 'Going down'}[action];
    diagram.actionText.text(actionLabel);
}


/* Control the diagram by letting the AI agent choose the action. This
   controller is simple. Every STEP_TIME_MS milliseconds choose an
   action, simulate the action in the world, and draw the action on
   the page. */
const STEP_TIME_MS = 3000;
function makeAgentControlledDiagram() {
    let diagram = makeDiagram('#agent-controlled-diagram svg');

    function update() {
        let location = diagram.world.location;
        let percept = diagram.world.floors[location].dirty;
        let percept2 = diagram.world.floors[location].dirty2;

        let action = reflexVacuumAgent(diagram.world);

        diagram.world.simulate(action);
        renderWorld(diagram);
        renderAgentPercept(diagram, percept, percept2);
        renderAgentAction(diagram, action);
    }
    update();
    setInterval(update, STEP_TIME_MS);
}

makeAgentControlledDiagram();


