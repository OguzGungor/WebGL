var canvas;
var gl;

var NumVertices = 36;

var vBufferId;
var bufferId;
var program;

var stack = [];
var animation;


var k = 0;

var animation_steps1 = [];
var animation_steps2 = [];
var animation_steps3 = [];
var animation_steps4 = [];

var modelViewMatrix, projectionMatrix;

var modelViewMatrixLoc;

var points = [];
var normals = [];
var spider = [];

var thetaLoc;
var viewerPos;

var lightPosition = vec4(5.0, 5.0, 4.0, 0);
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.0, 0.0, 0.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4( 1.0, 1.0, 0.0, 1.0 );
var materialShininess = 100;

var vertices = [
    vec4( 0, 0,  1, 1.0 ),
    vec4( 0,  1,  1, 1.0 ),
    vec4(  1,  1,  1, 1.0 ),
    vec4(  1, 0,  1, 1.0 ),
    vec4( 0, 0, 0, 1.0 ),
    vec4( 0,  1, 0, 1.0 ),
    vec4(  1,  1, 0, 1.0 ),
    vec4(  1, 0, 0, 1.0 )
];

function quad(  a,  b,  c,  d ) {

    var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);

    normals.push(normal); 
    points.push(vertices[a]); 
    normals.push(normal); 
    points.push(vertices[b]); 
    normals.push(normal); 
    points.push(vertices[c]);
    normals.push(normal); 
    points.push(vertices[a]); 
    normals.push(normal); 
    points.push(vertices[c]); 
    normals.push(normal); 
    points.push(vertices[d]); 
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
 }

window.onload = function init(){
    document.getElementById( "gl-canvas" ).width =document.body.clientWidth*0.46;
    document.getElementById( "gl-canvas" ).height =document.body.clientWidth*0.46;

    modelViewMatrix=translate(0,0,0);
    //initialize WebGL  
    canvas = document.getElementById( "gl-canvas" );    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //initialize attributes to GL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.enable(gl.DEPTH_TEST);

    //initialize shaders
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorCube();

    //normals buffer
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    //initialize vPosition buffer
    vbufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vbufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPos = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPos, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPos ); 
    
    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    viewerPos = vec3(0.0, 0.0, -20.0 );

    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    initThetas();
    initHandlers();
    createSpiderHierarchy();

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
        flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
        flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
        flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
        flatten(lightPosition) );
        
    gl.uniform1f(gl.getUniformLocation(program, 
        "shininess"),materialShininess);
    

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );
    gl.clear( gl.COLOR_BUFFER_BIT );
    render();

}

function createSpiderHierarchy(){
    //torso
    spider[torso.id] = createComponent(torso, null , neck.id, torso);

    //neck
    spider[neck.id] = createComponent(neck, legs.upper.right.back.id, head.id , neck);

    //upper legs and neck
    spider[legs.upper.right.back.id] = createComponent(legs.upper.right.back , legs.upper.right.middle.id , legs.lower.right.back.id , legs.upper);
    spider[legs.upper.right.middle.id] = createComponent(legs.upper.right.middle , legs.upper.right.front.id , legs.lower.right.middle.id , legs.upper);
    spider[legs.upper.right.front.id] = createComponent(legs.upper.right.front , leftLegsTemp.id , legs.lower.right.front.id,legs.upper);
    //neck-head goes here ,change sibling above
    
    spider[leftLegsTemp.id] = createComponent(leftLegsTemp,null,legs.upper.left.back.id, leftLegsTemp);
    spider[legs.upper.left.back.id] = createComponent(legs.upper.left.back, legs.upper.left.middle.id,legs.lower.left.back.id,legs.upper);
    spider[legs.upper.left.middle.id] = createComponent(legs.upper.left.middle, legs.upper.left.front.id,legs.lower.left.middle.id,legs.upper );
    spider[legs.upper.left.front.id] = createComponent(legs.upper.left.front,null,legs.lower.left.front.id,legs.upper);

    //head
    spider[head.id] = createComponent(head, null, null , head);

    //lowerlegs
    spider[legs.lower.right.back.id] = createComponent(legs.lower.right.back,null,null,legs.lower);
    spider[legs.lower.right.middle.id] = createComponent(legs.lower.right.middle,null,null,legs.lower);
    spider[legs.lower.right.front.id]=createComponent(legs.lower.right.front,null,null,legs.lower);
    spider[legs.lower.left.back.id] = createComponent(legs.lower.left.back,null,null,legs.lower);
    spider[legs.lower.left.middle.id] = createComponent(legs.lower.left.middle, null , null , legs.lower);
    spider[legs.lower.left.front.id] = createComponent(legs.lower.left.front , null , null , legs.lower);
   

}

function traverse(id){
    if(id == null)
        return;

    stack.push(modelViewMatrix);
    render_component(id); 
    
    if(spider[id].child != null){
        traverse(spider[id].child);
    }

    modelViewMatrix = stack.pop();

    if(spider[id].sibling != null){
        traverse(spider[id].sibling);
    }   

    
}
function render_component(id){
    modelViewMatrix = mult(modelViewMatrix,translate(spider[id].componentTranslate.gap1,spider[id].componentTranslate.gap2,spider[id].componentTranslate.gap3));
    modelViewMatrix = mult(modelViewMatrix,rotate(theta1[id],1,0,0));
    modelViewMatrix = mult(modelViewMatrix,rotate(theta2[id],0,1,0));    
    modelViewMatrix = mult(modelViewMatrix,rotate(theta3[id],0,0,1));
    var s = mult(modelViewMatrix,scale4(spider[id].dim.width,spider[id].dim.height,spider[id].dim.depth));
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(s) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices);
    
}


function render(){
    
    var tempMVM = modelViewMatrix;    
    modelViewMatrix = mult(modelViewMatrix,translate(lightPosition[0],lightPosition[1],lightPosition[2]));
     modelViewMatrix = mult(modelViewMatrix,rotate(45,1,0,0));
     modelViewMatrix = mult(modelViewMatrix,rotate(45,0,1,0));     
     modelViewMatrix = mult(modelViewMatrix,scale4(1,1,1));
     gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(modelViewMatrix) );
     gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
    modelViewMatrix = tempMVM;

    
    materialDiffuse = vec4( 191.0/255, 150.0/255, 126.0/255, 1.0); 
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
     traverse(torso.id);

     
     tempMVM = modelViewMatrix;
     materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);    
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );


    requestAnimationFrame(render);
     
}

//update slider values in a case such as user pressing reset button 
function updateSliderValues() {
    document.getElementById('x').value = torso.gap1*1000;
    document.getElementById('y').value = torso.gap2*1000;

    document.getElementById('torso-x').value = theta1[torso.id];
    document.getElementById('torso-y').value = theta2[torso.id];
    document.getElementById('torso-z').value = theta3[torso.id];
    
    document.getElementById('neck-x').value = -1 * theta1[neck.id];
    document.getElementById('neck-y').value = theta2[neck.id];
    
    document.getElementById('head-x').value = theta1[head.id];
    
    document.getElementById('upper-right-front-x').value = theta1[legs.upper.right.front.id];
    document.getElementById('upper-right-front-y').value = theta2[legs.upper.right.front.id];
    document.getElementById('upper-right-front-z').value = theta3[legs.upper.right.front.id];
    
    document.getElementById('upper-right-middle-x').value = theta1[legs.upper.right.middle.id];
    document.getElementById('upper-right-middle-y').value = theta2[legs.upper.right.middle.id];
    document.getElementById('upper-right-middle-z').value = theta3[legs.upper.right.middle.id];

    document.getElementById('upper-right-back-x').value = -1 * theta1[legs.upper.right.back.id];
    document.getElementById('upper-right-back-y').value = -1 * theta2[legs.upper.right.back.id];
    document.getElementById('upper-right-back-z').value = theta3[legs.upper.right.back.id];
    
    document.getElementById('upper-left-front-x').value = -1 * theta1[legs.upper.left.front.id];
    document.getElementById('upper-left-front-y').value = -1 * theta2[legs.upper.left.front.id];
    document.getElementById('upper-left-front-z').value = theta3[legs.upper.left.front.id];
    
    document.getElementById('upper-left-middle-x').value = -1 * theta1[legs.upper.left.middle.id];
    document.getElementById('upper-left-middle-y').value = -1 * theta2[legs.upper.left.middle.id];
    document.getElementById('upper-left-middle-z').value = theta3[legs.upper.left.middle.id];

    document.getElementById('upper-left-back-x').value = theta1[legs.upper.left.back.id];
    document.getElementById('upper-left-back-y').value = theta2[legs.upper.left.back.id];
    document.getElementById('upper-left-back-z').value = theta3[legs.upper.left.back.id];

    document.getElementById('lower-right-front').value = theta3[legs.lower.right.front.id];
    document.getElementById('lower-right-middle').value = theta3[legs.lower.right.middle.id]
    document.getElementById('lower-right-back').value = theta3[legs.lower.right.back.id];
    document.getElementById('lower-left-front').value = theta3[legs.lower.left.front.id];
    document.getElementById('lower-left-middle').value = theta3[legs.lower.left.middle.id];
    document.getElementById('lower-left-back').value = theta3[legs.lower.left.back.id];
}

// initialize all event handlers (sliders, buttons)
function initHandlers(){

    document.getElementById('save-step').addEventListener("click", function()
    {
        if(animation_steps1.length == 0)
        {
            animation_steps1.push(theta1.slice());
            animation_steps2.push(theta2.slice());
            animation_steps3.push(theta3.slice());        
            var gap = [];
            gap.push(torso.gap1);
            gap.push(torso.gap2);
            gap.push(torso.gap3);
            animation_steps4.push(gap);
        }
        else
        {
            //45 50 70
            var current_Pos1 = theta1.slice();
            var current_Pos2 = theta2.slice();
            var current_Pos3 = theta3.slice();            
            var gap = [];
            gap.push(torso.gap1);
            gap.push(torso.gap2);
            gap.push(torso.gap3);   
            var current_Pos4 = gap;
            //30 60 70
            var last1 = animation_steps1.pop();            
            var last2 = animation_steps2.pop();            
            var last3 = animation_steps3.pop();
            var last4 = animation_steps4.pop();

            //-15 10 0
            var diff1 = [];            
            var diff2 = [];            
            var diff3= [];                       
            var diff4= [];
            for(var i = 0; i < last1.length; i++){
                diff1.push(last1[i] - current_Pos1[i]);   
                diff2.push(last2[i] - current_Pos2[i]); 
                diff3.push(last3[i] - current_Pos3[i]);                
                diff4.push(last4[i] - current_Pos4[i]);
            }
            console.log(last4 + ":" + current_Pos4);
            console.log(diff4);

            //15 10 0
            var temp_diff1 = diff1.slice();
            var temp_diff2 = diff2.slice();
            var temp_diff3 = diff3.slice();
            var temp_diff4 = diff4.slice();
            for(var i = 0; i < temp_diff1.length; i++){

                temp_diff1[i] = (temp_diff1[i] < 0) ? temp_diff1[i] * (-1) : temp_diff1[i];                
                temp_diff2[i] = (temp_diff2[i] < 0) ? temp_diff2[i] * (-1) : temp_diff2[i];                
                temp_diff3[i] = (temp_diff3[i] < 0) ? temp_diff3[i] * (-1) : temp_diff3[i];               
                temp_diff4[i] = (temp_diff4[i] < 0) ? temp_diff4[i] * (-1) : temp_diff4[i];
            }

            //10
            var min_diff1 = Math.min.apply(null, temp_diff1.filter(Boolean));            
            var min_diff2 = Math.min.apply(null, temp_diff2.filter(Boolean));            
            var min_diff3 = Math.min.apply(null, temp_diff3.filter(Boolean));                       
            var min_diff4 = Math.min.apply(null, temp_diff4.filter(Boolean));

            if(min_diff1 < 0.001){
                min_diff1 = 10;
            }
            if(min_diff2 < 0.001){
                min_diff2 = 10;
            }
            if(min_diff3 < 0.001){
                min_diff3 = 10;
            }
            if(min_diff4 < 0.001){                
                min_diff4 = 10;
            }
            console.log(min_diff1);
            
            console.log(min_diff2);
            
            console.log(min_diff3);
            
            console.log(min_diff4);
            var min_diff = Math.min(min_diff1,min_diff2,min_diff3,min_diff4);
            

            for(var i = 0; i < last1.length; i++)
            {   //-1.5 1 0
                diff1[i] /= min_diff;
                diff2[i] /= min_diff;
                diff3[i] /= min_diff;                
                diff4[i] /= min_diff;
            }
            //10

            //30 60 70
            console.log(min_diff);
            for(var i = 0; i < render_freq*Math.abs(min_diff); i++)
            {
                //31.5 59 70
                //33 58 70
                //34.5 57 70
                //.
                //.
                //.
                //45 50 70
                var last1 = last1.map(function (num, idx) {
                  return num - diff1[idx]/render_freq;
                });
                
                var last2 = last2.map(function (num, idx) {
                    return num - diff2[idx]/render_freq;
                  });
                  
                var last3 = last3.map(function (num, idx) {
                    return num - diff3[idx]/render_freq;
                  });
                  var last4 = last4.map(function (num, idx) {
                    return num - diff4[idx]/render_freq;
                  });

                animation_steps1.push(last1);                
                animation_steps2.push(last2);                
                animation_steps3.push(last3);                               
                animation_steps4.push(last4);                
                console.log("saved");
                
            }
        }
    });

    document.getElementById("save-anim").onclick = function(){
        
        var saved_data = "";

        for(var i = 0; i < animation_steps1.length; i++)
        {
            saved_data+=animation_steps1[i];
            saved_data+="&";
            saved_data+=animation_steps2[i];
            saved_data+="&";
            saved_data+=animation_steps3[i];
            saved_data+="&";
            saved_data+=animation_steps4[i];
            if(i < animation_steps1.length-1){
                saved_data+="||";
            }
            /*
            saved_data += key_frames[i];
            saved_data = (i == key_frames.length - 1) ? saved_data : saved_data + splitter;*/
        }

        download("animation.txt", saved_data);
    }

    document.getElementById("interpolationFactor").oninput = function(){
        render_freq = this.value;
    }    

    document.getElementById('animate').addEventListener("click", function()
    {
        if(animation_steps1.length == 0)
        {
            
        }
        else
        {
           
            
            animation = setInterval(animate, anim_delay);
        }
    });

    document.getElementById("reset").addEventListener( "click", function(){

        initThetas();
        updateSliderValues();
        render();
        }
    );

    document.getElementById("save-config").addEventListener( "click", function(){        
        default_gaps[0] = torso.gap1;
        default_gaps[1] = torso.gap2;
        default_gaps[2] = torso.gap3;
        default_theta = [];
        default_theta.push(theta1);
        default_theta.push(theta2);
        default_theta.push(theta3);
    }
    );
    document.getElementById('load').onchange = function()
    {
        var file = this.files[0];
        var fileReader = new FileReader();

        // Reference:   https://blog.teamtreehouse.com/reading-files-using-the-html5-filereader-api
        fileReader.onload = function(e)
        {
            animation_steps1 = [];
            animation_steps2 = [];
            animation_steps3 = [];
            animation_steps4 = [];    // Clearing the array of frames

            var data = this.result;
            data = data.split("||");
            var data2;
            var parsed_data = [];
                       
            for(var i = 0; i < data.length; i++)
            {
                data2 = data[i].split("&"); 
                parsed_data = JSON.parse("[" + data2[0] + "]")
                animation_steps1.push(parsed_data);                
                parsed_data = JSON.parse("[" + data2[1] + "]")
                animation_steps2.push(parsed_data);                
                parsed_data = JSON.parse("[" + data2[2] + "]")
                animation_steps3.push(parsed_data);                
                parsed_data = JSON.parse("[" + data2[3] + "]")
                animation_steps4.push(parsed_data);
            }
        };

        fileReader.readAsText(file);
    };

    document.getElementById("x").oninput = function(){
        
        torso.gap1 = this.value/1000;
        render();
    }
    document.getElementById("y").oninput = function(){
        torso.gap2=this.value/1000;
        render();
    }

    
    document.getElementById("z").oninput = function(){
        torso.gap3=this.value;
        render();
    }

    document.getElementById("speed").oninput = function(){
        clearInterval(animation);
        anim_delay = -this.value;        
        animation = setInterval(animate, anim_delay);
    }

    document.getElementById("torso-x").oninput = function(){
        theta1[torso.id] = this.value;
        render();
    }
    document.getElementById("torso-y").oninput = function(){
        theta2[torso.id] = this.value;
        render();
    }
    document.getElementById("torso-z").oninput = function(){
        theta3[torso.id] = this.value;
        render();
    }

    document.getElementById("light-x").oninput = function(){
        lightPosition[0] = this.value;        	
        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
        flatten(lightPosition) );
        render();
    }
    document.getElementById("light-y").oninput = function(){
        lightPosition[1] = this.value;        	
        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
            flatten(lightPosition) );
        render();
    }
    document.getElementById("light-z").oninput = function(){
        lightPosition[2] = this.value;	
        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
            flatten(lightPosition) );
        render();
    }


    document.getElementById("neck-x").oninput = function(){
        theta1[neck.id] = -1 * Number(this.value);
        render();
    }

    document.getElementById("neck-y").oninput = function(){
        theta2[neck.id] = this.value;
        render();
    }

    document.getElementById("head-x").oninput = function(){
        theta1[head.id] = this.value;
        render();
    }

    
    //------------------Right upper legs-------------------

    document.getElementById("upper-right-front-x").oninput = function(){
        theta1[legs.upper.right.front.id] = this.value;
        render();
    }

    document.getElementById("upper-right-front-y").oninput = function(){
        theta2[legs.upper.right.front.id] = this.value;
        render();
    }
    document.getElementById("upper-right-front-z").oninput = function(){
        theta3[legs.upper.right.front.id] = this.value;
        render();
    }

    document.getElementById("upper-right-middle-x").oninput = function(){
        theta1[legs.upper.right.middle.id] = this.value;
        render();
    }

    document.getElementById("upper-right-middle-y").oninput = function(){
        theta2[legs.upper.right.middle.id] = this.value;
        render();
    }
    document.getElementById("upper-right-middle-z").oninput = function(){
        theta3[legs.upper.right.middle.id] = this.value;
        render();
    }

    document.getElementById("upper-right-back-x").oninput = function(){
        theta1[legs.upper.right.back.id] = -1 * Number(this.value);
        render();
    }

    document.getElementById("upper-right-back-y").oninput = function(){
        theta2[legs.upper.right.back.id] = -1 * Number(this.value);
        render();
    }
    document.getElementById("upper-right-back-z").oninput = function(){
        theta3[legs.upper.right.back.id] = this.value;
        render();
    }


    //------------------Left upper legs-------------------


    document.getElementById("upper-left-front-x").oninput = function(){
        theta1[legs.upper.left.front.id] = -1 * Number(this.value)
        render();
    }

    document.getElementById("upper-left-front-y").oninput = function(){
        theta2[legs.upper.left.front.id] = -1 * Number(this.value);
        render();
    }
    document.getElementById("upper-left-front-z").oninput = function(){
        theta3[legs.upper.left.front.id] = this.value;
        render();
    }

    document.getElementById("upper-left-middle-x").oninput = function(){
        theta1[legs.upper.left.middle.id] = -1 * Number(this.value);
        render();
    }

    document.getElementById("upper-left-middle-y").oninput = function(){
        theta2[legs.upper.left.middle.id] = -1 * Number(this.value);
        render();
    }
    document.getElementById("upper-left-middle-z").oninput = function(){
        theta3[legs.upper.left.middle.id] = this.value;
        render();
    }

    document.getElementById("upper-left-back-x").oninput = function(){
        theta1[legs.upper.left.back.id] = this.value;
        render();
    }

    document.getElementById("upper-left-back-y").oninput = function(){
        theta2[legs.upper.left.back.id] = this.value;
        render();
    }
    document.getElementById("upper-left-back-z").oninput = function(){
        theta3[legs.upper.left.back.id] = this.value;
        render();
    }
    
    // //------------------Right lower legs-------------------

    
    document.getElementById("lower-right-front").oninput = function(){
        theta3[legs.lower.right.front.id] = this.value;
        render();
    }

    
    document.getElementById("lower-right-middle").oninput = function(){
        theta3[legs.lower.right.middle.id] = this.value;
        render();
    }

    
    document.getElementById("lower-right-back").oninput = function(){
        theta3[legs.lower.right.back.id] = this.value;
        render();
    }


    //------------------Left lower legs-------------------


    document.getElementById("lower-left-front").oninput = function(){
        theta3[legs.lower.left.front.id] = this.value;
        render();
    }
    
    document.getElementById("lower-left-middle").oninput = function(){
        theta3[legs.lower.left.middle.id] = this.value;
        render();
    }

    document.getElementById("lower-left-back").oninput = function(){
        theta3[legs.lower.left.back.id] = this.value;
        render();
    }
    document.body.onresize = function(){
        document.getElementById( "gl-canvas" ).width =document.body.clientWidth*0.46;
        document.getElementById( "gl-canvas" ).height =document.body.clientWidth*0.46;
    }
}

function createComponent(componentTranslate,sibling,child,dim){
    return{
        componentTranslate : componentTranslate,
        sibling:sibling,
        child:child,
        dim : dim
    }
}

function animate()
            {
                if(k == animation_steps1.length)
                {
                    k = 0;
                    clearInterval(animation);
                }
                else
                {
                    theta1 = animation_steps1[k];
                    theta2 = animation_steps2[k];
                    theta3 = animation_steps3[k];
                    var gap = animation_steps4[k];
                    torso.gap3= gap[2];
                    torso.gap2 = gap[1];
                    torso.gap1 = gap[0];
                    k++;
                }
}

//Reference: https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
function download(filename, text)
{
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


