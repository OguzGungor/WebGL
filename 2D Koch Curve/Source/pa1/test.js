var canvas;
var gl;

var textFile = null;
var iterations = 0;

var cBufferId;
var bufferId;
var program;

var maxNumVertices  = 65535;
var index = 0;

//buffers resides in stack
var indices = [];
var edges = [];

//original indices and colors before iterations to save the files
var originalIndices = [];
var originalEdges = [];

//switches for functionalities
var draw = 1;

window.onload = function init(){

    
    /*
    ---------------------------------------------------------------------------------------------------------------------------------------
    listeners
    ---------------------------------------------------------------------------------------------------------------------------------------
    */

    //listener to change background Color
    document.getElementById("Background").addEventListener("change",function(){
        
        //convert HTML input hex value to RGB value
        var temp = hexToRgb(this.value);
        //set Clear color as picked color        
        gl.clearColor( temp.r/256,temp.g/256,temp.b/256,1.0);
        //rerun render after modifications
        render();
    });

    //button listener to declare starting to draw
    /*document.getElementById("drawSwitch").addEventListener("click",function(){
        draw = 1;
        alert("draw set to:" + draw);
    });*/

    //button to declare drawing is finished
    document.getElementById("done").addEventListener("click",function(){
        
        if(draw == 0){// if draw is not set to 1, user will be noticed clear the chard
            alert("to Redraw, press 'clear'");
        }else{//if draw is set to 1, last edge of the polygon will be drawn
            if(index == 0){//to avoid miss use of button before the draw
                alert("you should determine the points by clicking on chard");
            }else{

                //pushes last indice and first indice to complete polygon by setting the last edge
                indices.push(indices[indices.length-1]);
                indices.push(indices[0]);

                //getting and converting RGB values from HTML element
                var temp = hexToRgb(document.getElementById("Edge").value);
                var m = vec4(temp.r/256,temp.g/256,temp.b/256,1.0);

                //set vec4 to stack array to set color
                edges.push(m);
                edges.push(m);

                //increment index according to pushes
                index+=2;

                //save stack data to GPU buffers
                bufferPolygon();

                //render
                render();

                //draw set to 0 after draing the polygon to avoid saving vertices by missclicks
                draw = 0;
            }
        }
    });

    //iterate 1 button action listener to make step by step koch curve iteration
    document.getElementById("iterate1").addEventListener("click",function(){

        if(index == 0){//to avoid missclick before the draw
            alert("you should draw the polygon first");
        }else{            
            //commit one koch rule for all edges
            setKoch();

            //arranges the iteration count
            iterations++;
        }
    });

    //iterate 2 button action listener to make more than one step koch curve iteration
    document.getElementById("iterate2").addEventListener("click",function(){
        if(index == 0){//to avoid missclick before the draw
            alert("you should draw the polygon first");
        }else{   

            //commits given number of koch iterations
            for(var i = 0 ; i < document.getElementById("textin").value ; i++){                
                setKoch();
                iterations++;
            }      
        }
    });

    //save action listener to write shape to a local text file
    document.getElementById("save").addEventListener("click",function(){

        /*
        ---------------------------------------------------------------------------------------------------------------------------------------
        encoding iteration count,original indices and color to string
        ---------------------------------------------------------------------------------------------------------------------------------------
        */
        var text = "";
        text += iterations;
        text+= "||";
        console.log(originalIndices);
        for(var i = 0 ; i < originalIndices.length-1 ; i++){
            text += originalIndices[i][0];
            text += ":";
            text += originalIndices[i][1]; 
            text += "&";
            text += originalEdges[i][0]
            text += ":";
            text += originalEdges[i][1]
            text += ":";
            text += originalEdges[i][2]
            text += ":";
            text += originalEdges[i][3]
            text += "\n";
        }
        text += originalIndices[originalIndices.length-1][0];
        text += ":";
        text += originalIndices[originalIndices.length-1][1];         
        text += "&";
        text += originalEdges[originalIndices.length-1][0]
        text += ":";
        text += originalEdges[originalIndices.length-1][1]
        text += ":";
        text += originalEdges[originalIndices.length-1][2]
        text += ":";
        text += originalEdges[originalIndices.length-1][3]

        /*
        ---------------------------------------------------------------------------------------------------------------------------------------
        ***************************************************************************************************************************************
        ---------------------------------------------------------------------------------------------------------------------------------------
        */
        
        //creating link to save file to the local memory
        var link = document.getElementById('downloadlink');
        link.href = makeTextFile(text);
        link.style.display = 'block';
    });

    //Action listener to load shape by reading local data
    document.getElementById('inputfile') 
            .addEventListener('change', function() { 
              
                
            //initializing file reader
            var fr=new FileReader(); 

            //runs after file reader loaded with input file change in HTML element
            fr.onload=function(){ 
                //reseting the attributes
                indices = [];
                edges = [];
                index = 0;
                /*
                ---------------------------------------------------------------------------------------------------------------------------------------
                Decryption of text file
                ---------------------------------------------------------------------------------------------------------------------------------------
                */
                var list =fr.result.split("||");
                var temp = list[0];
                list = list[1].split("\n");
                for(i in list){
                    var list2 = list[i].split("&");
                    var temp2 = list2[0].split(":");
                    indices.push(vec2(parseFloat(temp2[0]),parseFloat(temp2[1])));
                    temp2 = list2[1].split(":");
                    edges.push(vec4(parseFloat(temp2[0]),parseFloat(temp2[1]),parseFloat(temp2[2]),parseFloat(temp2[3])));
                    index++;
                }
                /*
                ---------------------------------------------------------------------------------------------------------------------------------------
                ***************************************************************************************************************************************
                ---------------------------------------------------------------------------------------------------------------------------------------
                */

                //applying koch to original vertices
                for(var i = 0 ; i < temp ; i++){
                    setKoch();
                }

                //saving stack arrays to the GPU buffer
                bufferPolygon3();

                //render GPU buffers
                render();
                draw = 0;
            } 
                //reads selected file and runs fr.onload  
                fr.readAsText(this.files[0]); 
    });

    //clear button action listener to reinitialize buffers
    document.getElementById("clear").addEventListener("click",function(){
        
        //re-initialize vPosition buffer
        bufferId = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
        gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW );
        var vPos = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPos, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPos );
        
        
        //re-initialize vColor buffer
        cBufferId = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
        gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );
        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        //reseting stack variables
        indices = [];
        edges=[];
        index = 0;        
        draw = 1;
        iterations = 0;

        render();
    });


    //mouse click event to set vertices of the polygon to stack buffer
    document.getElementById( "gl-canvas" ).addEventListener("mousedown",function(event){

        if(draw){//saving clicked point to stack buffers and GPU

            //color value of the edge from HTML colorpicker
            var temp = hexToRgb(document.getElementById("Edge").value);
            var m = vec4(temp.r/256,temp.g/256,temp.b/256,1.0);

            if(indices.length > 0){
                originalIndices.push(indices[indices.length -1]);
                indices.push(indices[indices.length -1]);
                originalEdges.push(m);
                edges.push(m);                
                index++;
            }            

            //scaled mouse location inside canvas
            var t = vec2(2*event.clientX/canvas.width-1, 
                2*(canvas.height-event.clientY)/canvas.height-1);

            originalIndices.push(t);
            indices.push(t);
            originalEdges.push(m);
            edges.push(m);   
            
            //arranging index
            index++;
            
            //buffer new edge to the GPU
            bufferPolygon();
             
        }else{//to avoid missuse of mousedown on canvas and to notice user
            alert(`you should click "clear" to draw again`);
        }
    });

    //mouse move events to display next edge to be drawn
    document.getElementById( "gl-canvas" ).addEventListener("mousemove",function(event){
        if(draw){
            if(indices.length > 0){
                //buffer the last clicked vertices    
                gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
                gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index), flatten(indices[index-1]));
            
                
                //color value of the edge from HTML colorpicker
                var temp = hexToRgb(document.getElementById("Edge").value);
                var m = vec4(temp.r/256,temp.g/256,temp.b/256,1.0);

                //buffer the selected color to last clicked vertices
                gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
                gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index), flatten(m));
                  
                
                //scaled mouse location inside canvas
                var t = vec2(2*event.clientX/canvas.width-1, 
                    2*(canvas.height-event.clientY)/canvas.height-1);
                    
                //buffer the vertices of mouse position
                gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
                gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(t));

                //buffer the selected color to mouse position vertices
                gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
                gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index+1), flatten(m));

                //render
                render2();
            }
        }
    });

    /*
    //zoom event
    document.getElementById( "gl-canvas" ).addEventListener("wheel",function(event){
        if(event.deltaY == -100){
            for(var i = 0 ; i < indices.length-1 ; i+=2){
                indices[i][0] = indices[i][0] * 2;
                indices[i][1] = indices[i][1] * 2;   
            }
            
            indices[indices.length-1][0] = indices[indices.length-1][0] * 2;
            indices[indices.length-1][1] = indices[indices.length-1][1] * 2;
            bufferPolygon3();
            render();

        }else if(event.deltaY == 100){
            for(var i = 0 ; i < indices.length-1 ; i+=2){
                indices[i][0] = indices[i][0] / 2;
                indices[i][1] = indices[i][1] / 2;
            }
            
            indices[indices.length-1][0] = indices[indices.length-1][0] / 2;
            indices[indices.length-1][1] = indices[indices.length-1][1] / 2;
            bufferPolygon3();
            render();
        }
    });*/


    /*
    ---------------------------------------------------------------------------------------------------------------------------------------
    ***************************************************************************************************************************************
    ---------------------------------------------------------------------------------------------------------------------------------------
    */

    //initialize WebGL  
    canvas = document.getElementById( "gl-canvas" );    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //initialize attributes to GL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    //initialize shaders
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    //initialize vPosition buffer
    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW );
    var vPos = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPos, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPos );
    
    
    //initialize vColor buffer
    cBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

}

//render function to render the data buffered to GPU until now 
function render2(){

    //clear and set background
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    //draw elements of data resides in buffers of GPU
    gl.drawArrays( gl.LINE_STRIP, 0, index+2);

}

//render function to render buffered data with completing polygon
function render(){

     //clear and set background
     gl.clear( gl.COLOR_BUFFER_BIT );
    
     //draw elements of data resides in buffers of GPU
     gl.drawArrays( gl.LINE_LOOP, 0, index);

}
//saving data that buffered to stack to GPU buffer
function bufferPolygon(){
    if(index>1){
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index-2), flatten(indices[index-2]));
            
        gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
        gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-2), flatten(edges[index-2]));
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index-1), flatten(indices[index-1]));

    gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-1), flatten(edges[index-1]));

}

//hex to RGB Helper function to convert value from HTML input
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

//setting koch function
function setKoch(){

    //local variables to hold required values
    var temp0;//to hold vector parallel to edge
    var temp1;//to hold vector perpendicular to ed
    var temp2 = [];//new indices array
    var temp3 = [];//new edges array
    var temp4;//new vec2 to be added to temp2
    var temp5;//new vec4 to be added to temp3

    // point 0 is not doubled, so it is pushed before the loop
    temp2.push(indices[0]);
    temp3.push(edges[0]);

    for(var i = 1 ; i < indices.length-1 ; i+=2){

        //color of the edge is set
        temp5 = edges[i];    
        
        //vector parallel to edge is set
        temp0 = subtract(indices[i+1],indices[i]);
        temp0 = vec2(temp0[0]/4,temp0[1]/4);
        
        //vector perpendicular to edge is set
        temp1 = vec2(-temp0[1],temp0[0]);

        //first point of the edge is coppied to the new array
        temp2.push(indices[i]);
        temp3.push(edges[i]);
        
        /*
        ---------------------------------------------------------------------------------------------------------------------------------------
        KOCH ITERATIONS
        ---------------------------------------------------------------------------------------------------------------------------------------
        */

        temp4 = add(indices[i],temp0);
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);
        temp4 = add(temp4,temp1);
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);        
        temp4 = add(temp4,temp0);        
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);   
        temp4 = subtract(temp4,temp1);        
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5); 
        temp4 = subtract(temp4,temp1);        
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);
        temp4 = add(temp4,temp0);        
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);        
        temp4 = add(temp4,temp1);
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);

         /*
        ---------------------------------------------------------------------------------------------------------------------------------------
        ***************************************************************************************************************************************
        ---------------------------------------------------------------------------------------------------------------------------------------
        */

        //last point of edge coppied to arrays
        temp2.push(indices[i+1]);
        temp3.push(edges[i+1]); 
        
        //if buffer size is exceeded, then iteration will stop
        if(temp2.length>65500){  
            break;
        }
    }

      /*
        ---------------------------------------------------------------------------------------------------------------------------------------
        Koch iteration between last element of and first element of array 
        ---------------------------------------------------------------------------------------------------------------------------------------
        */
        temp5 = edges[0];
        temp0 = subtract(indices[0],indices[indices.length-1]);
        temp0 = vec2(temp0[0]/4,temp0[1]/4);
        temp1 = vec2(-temp0[1],temp0[0]);
        temp2.push(indices[indices.length-1]);
        temp3.push(edges[edges.length-1]);
        temp4 = add(indices[indices.length-1],temp0);
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);
        temp4 = add(temp4,temp1);
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);        
        temp4 = add(temp4,temp0);        
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);   
        temp4 = subtract(temp4,temp1);        
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5); 
        temp4 = subtract(temp4,temp1);        
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);
        temp4 = add(temp4,temp0);        
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);        
        temp4 = add(temp4,temp1);
        temp2.push(temp4);
        temp2.push(temp4);        
        index+=2;
        temp3.push(temp5);
        temp3.push(temp5);
        temp2.push(indices[0]);
        temp3.push(edges[0]); 

        /*
        ---------------------------------------------------------------------------------------------------------------------------------------
        ***************************************************************************************************************************************
        ---------------------------------------------------------------------------------------------------------------------------------------
        */

    //setting new color and vertices vectors
    indices = temp2;
    edges = temp3;
    
    //buffering to GPU
    bufferPolygon2();

    //rendering new valeus
    render();


}
  
//to save the stack buffer to the GPU buffers with adding one last point to complete shape
function bufferPolygon2(){
    indices.push(indices[indices.length-1]);
    edges.push(edges[0]);
    for(var i = 0 ; i < indices.length ; i++){
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*i, flatten(indices[i]));
            gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
            gl.bufferSubData(gl.ARRAY_BUFFER, 16*i, flatten(edges[i]));
    }

}

//to save stack buffer to the GPU buffer directly
function bufferPolygon3(){
    for(var i = 0 ; i < indices.length ; i++){
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*i, flatten(indices[i]));
            gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
            gl.bufferSubData(gl.ARRAY_BUFFER, 16*i, flatten(edges[i]));
    }

}

//helper function for load operation
function makeTextFile(ca){
    var data = new Blob([ca], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    return textFile;
}