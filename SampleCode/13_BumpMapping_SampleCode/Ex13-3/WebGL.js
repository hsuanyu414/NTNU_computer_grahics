var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    attribute vec4 a_Normal;
    attribute vec3 a_Tagent;
    attribute vec3 a_Bitagent;
    attribute float a_crossTexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    varying mat4 v_TBN;
    varying vec3 v_Normal;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_TexCoord = a_TexCoord;
        //create TBN matrix 
        vec3 tagent = normalize(a_Tagent);
        vec3 bitagent = normalize(a_Bitagent);
        vec3 nVector;
        if( a_crossTexCoord > 0.0){
          nVector = cross(tagent, bitagent);
        } else{
          nVector = cross(bitagent, tagent);
        }
        v_TBN = mat4(tagent.x, tagent.y, tagent.z, 0.0, 
                           bitagent.x, bitagent.y, bitagent.z, 0.0,
                           nVector.x, nVector.y, nVector.z, 0.0, 
                           0.0, 0.0, 0.0, 1.0);
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform vec3 u_Color;
    uniform float u_shininess;
    uniform sampler2D u_Sampler0;
    uniform highp mat4 u_normalMatrix;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    varying mat4 v_TBN;
    varying vec3 v_Normal;
    void main(){
        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color.rgb;
        vec3 diffuseLightColor = u_Color.rgb;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        //normal vector from normal map
        vec3 nMapNormal = normalize( texture2D( u_Sampler0, v_TexCoord ).rgb * 2.0 - 1.0 );
        vec3 normal = normalize( vec3( u_normalMatrix * v_TBN * vec4( nMapNormal, 1.0) ) );
        
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
    
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;


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

/////BEGIN:///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function initAttributeVariable(gl, a_attribute, buffer){
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords, tagents, bitagents, crossTexCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  if( tagents != null ) o.tagentsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(tagents), 3, gl.FLOAT);
  if( bitagents != null ) o.bitagentsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(bitagents), 3, gl.FLOAT);
  if( crossTexCoords != null ) o.crossTexCoordsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(crossTexCoords), 1, gl.FLOAT);
  //you can have error check here
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}
/////END://///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var modelMatrix;
var nVertex;
var cameraX = 0, cameraY = 0, cameraZ = 7;
var lightX = 0, lightY = 0, lightZ = 7;
var cubeMapTex;
var sonicObj;
var rotateAngle = 0;
var textures = {};
var texCount = 0;
var numTextures = 1;

async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    sonicObj = await loadOBJtoCreateVBO('sonic.obj');

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord'); 
    program.a_Tagent = gl.getAttribLocation(program, 'a_Tagent'); 
    program.a_Bitagent = gl.getAttribLocation(program, 'a_Bitagent'); 
    program.a_crossTexCoord = gl.getAttribLocation(program, 'a_crossTexCoord'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_Color = gl.getUniformLocation(program, 'u_Color');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_Sampler0 = gl.getUniformLocation(program, 'u_Sampler0');

    var normalMapImage = new Image();
    normalMapImage.onload = function(){initTexture(gl, normalMapImage, "normalMapImage");};
    normalMapImage.src = "normalMap.jpeg";

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};
}

function draw(){
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.4,0.4,0.4,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  let vpMatrix = new Matrix4();
  vpMatrix.setPerspective(70, 1, 1, 100);
  vpMatrix.lookAt(cameraX, cameraY, cameraZ,   
                  0, 0, 0, 
                  0, 1, 0);

  let mdlMatrix = new Matrix4();
  mdlMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  mdlMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  mdlMatrix.scale(0.16, 0.16, 0.16);
  drawOneRegularObject(sonicObj, mdlMatrix, vpMatrix, 0.4, 0.4, 0.4);
}

function drawOneRegularObject(obj, modelMatrix, vpMatrix, colorR, colorG, colorB){
  gl.useProgram(program);
  let mvpMatrix = new Matrix4();
  let normalMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);

  //normal matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
  gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1f(program.u_Ka, 0.2);
  gl.uniform1f(program.u_Kd, 0.7);
  gl.uniform1f(program.u_Ks, 1.0);
  gl.uniform1f(program.u_shininess, 40.0);
  gl.uniform3f(program.u_Color, colorR, colorG, colorB);
  gl.uniform1i(program.u_Sampler0, 0);
  gl.uniform1i(program.u_Sampler1, 1);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures["normalMapImage"]);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
    initAttributeVariable(gl, program.a_TexCoord, obj[i].texCoordBuffer);
    initAttributeVariable(gl, program.a_Tagent, obj[i].tagentsBuffer);
    initAttributeVariable(gl, program.a_Bitagent, obj[i].bitagentsBuffer);
    initAttributeVariable(gl, program.a_crossTexCoord, obj[i].crossTexCoordsBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
}

function calculateTangentSpace(position, texcoord){
  //iterate through all triangles
  let tagents = [];
  let bitagents = [];
  let crossTexCoords = [];
  for( let i = 0; i < position.length/9; i++ ){
    let v00 = position[i*9 + 0];
    let v01 = position[i*9 + 1];
    let v02 = position[i*9 + 2];
    let v10 = position[i*9 + 3];
    let v11 = position[i*9 + 4];
    let v12 = position[i*9 + 5];
    let v20 = position[i*9 + 6];
    let v21 = position[i*9 + 7];
    let v22 = position[i*9 + 8];
    let uv00 = texcoord[i*6 + 0];
    let uv01 = texcoord[i*6 + 1];
    let uv10 = texcoord[i*6 + 2];
    let uv11 = texcoord[i*6 + 3];
    let uv20 = texcoord[i*6 + 4];
    let uv21 = texcoord[i*6 + 5];

    let deltaPos10 = v10 - v00;
    let deltaPos11 = v11 - v01;
    let deltaPos12 = v12 - v02;
    let deltaPos20 = v20 - v00;
    let deltaPos21 = v21 - v01;
    let deltaPos22 = v22 - v02;

    let deltaUV10 = uv10 - uv00;
    let deltaUV11 = uv11 - uv01;
    let deltaUV20 = uv20 - uv00;
    let deltaUV21 = uv21 - uv01;

    let r = 1.0 / (deltaUV10 * deltaUV21 - deltaUV11 * deltaUV20);
    for( let j=0; j< 3; j++ ){
      crossTexCoords.push( (deltaUV10 * deltaUV21 - deltaUV11 * deltaUV20) );
    }
    let tangentX = (deltaPos10 * deltaUV21 - deltaPos20 * deltaUV11)*r;
    let tangentY = (deltaPos11 * deltaUV21 - deltaPos21 * deltaUV11)*r;
    let tangentZ = (deltaPos12 * deltaUV21 - deltaPos22 * deltaUV11)*r;
    for( let j = 0; j < 3; j++ ){
      tagents.push(tangentX);
      tagents.push(tangentY);
      tagents.push(tangentZ);
    }
    let bitangentX = (deltaPos20 * deltaUV10 - deltaPos10 * deltaUV20)*r;
    let bitangentY = (deltaPos21 * deltaUV10 - deltaPos11 * deltaUV20)*r;
    let bitangentZ = (deltaPos22 * deltaUV10 - deltaPos12 * deltaUV20)*r;
    for( let j = 0; j < 3; j++ ){
      bitagents.push(bitangentX);
      bitagents.push(bitangentY);
      bitagents.push(bitangentZ);
    }
  }
  let obj = {};
  obj['tagents'] = tagents;
  obj['bitagents'] = bitagents;
  obj['crossTexCoords'] = crossTexCoords;
  return obj;
}

async function loadOBJtoCreateVBO( objFile ){
  let objComponents = [];
  response = await fetch(objFile);
  text = await response.text();
  obj = parseOBJ(text);
  for( let i=0; i < obj.geometries.length; i ++ ){
    let tagentSpace = calculateTangentSpace(obj.geometries[i].data.position, 
                                            obj.geometries[i].data.texcoord);
    let o = initVertexBufferForLaterUse(gl, 
                                        obj.geometries[i].data.position,
                                        obj.geometries[i].data.normal, 
                                        obj.geometries[i].data.texcoord,
                                        tagentSpace.tagents,
                                        tagentSpace.bitagents,
                                        tagentSpace.crossTexCoords);
    objComponents.push(o);
  }
  return objComponents;
}

function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,    // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}


function mouseDown(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if( rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}

function mouseUp(ev){ 
    mouseDragging = false;
}

function mouseMove(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    if( mouseDragging ){
        var factor = 100/canvas.height; //100 determine the spped you rotate the object
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; //yes, x for y, y for x, this is right
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;

    draw();
}

function initTexture(gl, img, texKey){
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

  textures[texKey] = tex;

  texCount++;
  if( texCount == numTextures)draw();
}

