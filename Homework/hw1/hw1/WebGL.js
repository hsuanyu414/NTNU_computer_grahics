var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    varying vec4 v_Color;
    void main(){
        gl_Position = a_Position;
        gl_PointSize = 5.0;
        v_Color = a_Color;
    }    
    `;

var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main(){
        gl_FragColor = v_Color;
    }
    `;

var graph = {color:1, shape:1};
var count = {point:0, square:0, circle:0, triangle:0};
p_points = []; //
q_points = []; //
c_points = []; //
t_points = []; // 

function compileShader(gl, vShaderText, fShaderText){
    //////Build vertex and fragment shader objects
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    //The way to  set up shader text source
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    //compile vertex shader
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);//print shader compiling error message
    }
    //compile fragment shader
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);//print shader compiling error message
    }

    /////link shader to program (by a self-define function)
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    //if not success, log the program info, and delete it.
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}

function main(){
    var canvas = document.getElementById('webgl');

    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    let renderProgram = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
 
    gl.useProgram(renderProgram);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    //mouse event (x, y)
    canvas.onmousedown = function(ev){click(ev, graph, gl, renderProgram)}
    //keyboard event (r, g, b)
    document.onkeypress = function(ev){keyFunction(ev, graph)}


}

function initVertexBuffersPoint(gl, program, arr){
    var n = 1;
    var arr1d = [].concat.apply([], arr);
    var vertices = new Float32Array(arr1d);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var FSIZE = vertices.BYTES_PER_ELEMENT;

    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);

    return n;
}
function initVertexBuffersTriangle(gl, program, arr){
    var n = 3;
    var arr1d = [].concat.apply([], arr);
    var vertices = new Float32Array(arr1d);
    //TODO-3: create a vertex buffer
    var vertexBuffer = gl.createBuffer() ;
    //TODO-4: bind buffer (gl.bindBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer) ;
    //TODO-5: bind buffer data (gl.bufferData)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW) ;

    var FSIZE = vertices.BYTES_PER_ELEMENT;


    //TODO-6: get reference of the attribute variable for vertex position
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    
    //TODO-7: layout of current vertex buffer object (gl.vertexAttribPointer)
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);

    //TODO-8: enable the attribute array
    gl.enableVertexAttribArray(a_Position);

    //TODO-9 repeat TODO-6~8 for the attribute variable to store vertex color information
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);
    
    return n;
}

function initVertexBuffersCircle(gl, program, arr){
    var n = 101 ;
    var arr1d = [].concat.apply([], arr);
    var vertices = new Float32Array(arr1d);
    
    
    //TODO-3: create a vertex buffer
    var vertexBuffer = gl.createBuffer() ;
    //TODO-4: bind buffer (gl.bindBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer) ;
    //TODO-5: bind buffer data (gl.bufferData)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW) ;

    var FSIZE = vertices.BYTES_PER_ELEMENT;


    //TODO-6: get reference of the attribute variable for vertex position
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    
    //TODO-7: layout of current vertex buffer object (gl.vertexAttribPointer)
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);

    //TODO-8: enable the attribute array
    gl.enableVertexAttribArray(a_Position);

    //TODO-9 repeat TODO-6~8 for the attribute variable to store vertex color information
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);
    
    return n;
}

function keyFunction(ev, graph){
    // console.log("You press "+event.keyCode);
    var input = ev.keyCode
    if(input == 82 | input == 114)
        graph.color = 1 ; //R for red
    else if(input == 71 | input == 103)
        graph.color = 2 ; //G for green
    else if(input == 66 | input == 98)
        graph.color = 3 ; //B for blue 
    else if(input == 80 | input == 112)
        graph.shape = 1 ; //P for point 
    else if(input == 81 | input == 113)
        graph.shape = 2 ; //Q for square 
    else if(input == 67 | input == 99)
        graph.shape = 3 ; //C for circle
    else if(input == 84 | input == 116)
        graph.shape = 4 ; //T for triangle 
}

function click(ev, graph, gl, renderProgram){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    console.log("x: " + x);
    console.log("y: " + y);
    console.log("Color is "+graph.color+" Shape is "+graph.shape);
    // console.log("rect. left, top, width, height: " + rect.left + " "  + rect.top + " " + rect.width + " " + rect.height );

    //Todo-1: convert x and y to canvas space and normal them to (-1, 1) for webgl to use
    x = ((x-rect.left)/rect.width)*2-1;
    y = ((rect.top-y)/rect.height)*2+1;
    r = parseFloat(Number(graph.color==1));
    g = parseFloat(Number(graph.color==2));
    b = parseFloat(Number(graph.color==3));

    if(graph.shape == 1){
        p_points.push([x, y, r, g, b]) ;
        count.point ++ ;
        if (count.point > 3)
            p_points.shift();
    }
    else if(graph.shape ==2){
        q_points.push([x-0.1, y+0.1, r, g, b]) ;
        q_points.push([x+0.1, y+0.1, r, g, b]) ;
        q_points.push([x-0.1, y-0.1, r, g, b]) ;
        q_points.push([x+0.1, y+0.1, r, g, b]) ;
        q_points.push([x-0.1, y-0.1, r, g, b]) ;
        q_points.push([x+0.1, y-0.1, r, g, b]) ;
        count.square ++ ;
        if (count.square > 3)
            for(var i = 0 ; i < 6 ; i ++)
                q_points.shift();
    }
    else if(graph.shape ==3){
        temp = []
        var N = 100 ;
        var R = 0.1 ;
        for(var i = 0 ; i <= N ; i ++){
            var theta = i * 2 * Math.PI / N ;
            var X = x+R * Math.sin(theta);
            var Y = y+R * Math.cos(theta);
            temp.push([X, Y, r, g, b]) ;
        }
        temp.push([x+R*Math.sin(0), y+R*Math.cos(0), r, g, b]);

        
        for(var i = 0 ; i <= N ; i ++){
            c_points.push([x, y, r, g, b]) ;
            c_points.push(temp[i]) ;
            c_points.push(temp[i+1]) ;
        }
        count.circle ++ ;
        if(count.circle > 3)
        {
            for(var i = 0 ; i < 303 ; i ++)
                c_points.shift();
        }
    }
    else if(graph.shape ==4){
        t_points.push([x, y+Math.sqrt(3)*0.2*0.3, r, g, b]) ;
        t_points.push([x+0.3*0.3, y-Math.sqrt(3)*0.1*0.3, r, g, b]) ;
        t_points.push([x-0.3*0.3, y-Math.sqrt(3)*0.1*0.3, r, g, b]) ;
        count.triangle ++ ;
        if(count.triangle > 3)
            for(var i = 0 ; i < 3 ; i ++)
                t_points.shift();
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var n = initVertexBuffersPoint(gl, renderProgram, p_points);
    gl.drawArrays(gl.POINTS, 0, p_points.length);
    var n = initVertexBuffersSquare(gl, renderProgram, q_points);
    gl.drawArrays(gl.TRIANGLES, 0, q_points.length);
    var n = initVertexBuffersTriangle(gl, renderProgram, t_points);
    gl.drawArrays(gl.TRIANGLES, 0, t_points.length);
    var n = initVertexBuffersCircle(gl, renderProgram, c_points);
    gl.drawArrays(gl.TRIANGLES, 0, c_points.length);
    

}

function initVertexBuffersSquare(gl, program, arr){
    var n = 4;
    var arr1d = [].concat.apply([], arr);
    var vertices = new Float32Array(arr1d);
    
    
    //TODO-3: create a vertex buffer
    var vertexBuffer = gl.createBuffer() ;
    //TODO-4: bind buffer (gl.bindBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer) ;
    //TODO-5: bind buffer data (gl.bufferData)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW) ;

    var FSIZE = vertices.BYTES_PER_ELEMENT;


    //TODO-6: get reference of the attribute variable for vertex position
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    
    //TODO-7: layout of current vertex buffer object (gl.vertexAttribPointer)
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);

    //TODO-8: enable the attribute array
    gl.enableVertexAttribArray(a_Position);

    //TODO-9 repeat TODO-6~8 for the attribute variable to store vertex color information
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);
    
    return n;
}



