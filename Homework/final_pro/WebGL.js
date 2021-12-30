var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform mat4 u_lightMatrix;
    uniform vec4 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        // let ambient and diffuse color are u_Color 
        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        
        vec3 ambient = ambientLightColor * u_Ka;
        vec3 normal = normalize(v_Normal);
        // vec3 v_LightPosition = (u_lightMatrix * u_LightPosition).xyz;
        vec3 v_LightPosition = (u_LightPosition).xyz;
        vec3 lightDirection = normalize(v_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;
        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }
        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

var VSHADER_SOURCE_TEXTURE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_TexCoord = a_TexCoord;
    }    
`;

var FSHADER_SOURCE_TEXTURE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform sampler2D u_Sampler;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    void main(){
        // let ambient and diffuse color are u_Color 
        // (you can also input them from ouside and make them different)
        vec3 texColor = texture2D( u_Sampler, v_TexCoord ).rgb;
        vec3 ambientLightColor = texColor;
        vec3 diffuseLightColor = texColor;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        
        vec3 ambient = ambientLightColor * u_Ka;
        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;
        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }
        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

var VSHADER_SOURCE_ENVCUBE = `
  attribute vec4 a_Position;
  varying vec4 v_Position;
  void main() {
    v_Position = a_Position;
    gl_Position = a_Position;
  } 
`;

var FSHADER_SOURCE_ENVCUBE = `
  precision mediump float;
  uniform samplerCube u_envCubeMap;
  uniform mat4 u_viewDirectionProjectionInverse;
  varying vec4 v_Position;
  void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_Position;
    gl_FragColor = textureCube(u_envCubeMap, normalize(t.xyz / t.w));
  }
`;

var VSHADER_SOURCE_TEXTURE_ON_CUBE = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_modelMatrix;
  uniform mat4 u_normalMatrix;
  varying vec4 v_TexCoord;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_TexCoord = a_Position;
    v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
    v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
  } 
`;

var FSHADER_SOURCE_TEXTURE_ON_CUBE = `
  precision mediump float;
  varying vec4 v_TexCoord;
  uniform vec3 u_ViewPosition;
  uniform vec3 u_Color;
  uniform samplerCube u_envCubeMap;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main() {
    vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
    vec3 normal = normalize(v_Normal);
    vec3 R = reflect(-V, normal);
    gl_FragColor = vec4(0.78 * textureCube(u_envCubeMap, R).rgb + 0.3 * u_Color, 1.0);
  }
`;

var VSHADER_SOURCE_BUMP = `
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

var FSHADER_SOURCE_BUMP = `
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

var VSHADER_SOURCE_REFLA = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }    
`;

var FSHADER_SOURCE_REFLA = `
    precision mediump float;
    uniform vec3 u_ViewPosition;
    uniform samplerCube u_envCubeMap;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
      float ratio = 1.00 / 1.1; //glass
      vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
      vec3 normal = normalize(v_Normal);
      // vec3 R = refract(-V, normal, ratio);
      vec3 R = reflect(-V, normal);
      gl_FragColor = vec4(textureCube(u_envCubeMap, R).rgb, 1.0);
    }
`;

var mdlStack = [];
var mdlMatrix = new Matrix4();
function pushMatrix(){
    mdlStack.push(new Matrix4(mdlMatrix));
}
function popMatrix(){
    mdlMatrix = mdlStack.pop();
}

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

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  //you can have error check here
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function initVertexBufferForLaterUseBump(gl, vertices, normals, texCoords, tagents, bitagents, crossTexCoords){
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

///// normal vector calculation (for the cube)
function getNormalOnVertices(vertices){
  var normals = [];
  var nTriangles = vertices.length/9;
  for(let i=0; i < nTriangles; i ++ ){
      var idx = i * 9 + 0 * 3;
      var p0x = vertices[idx+0], p0y = vertices[idx+1], p0z = vertices[idx+2];
      idx = i * 9 + 1 * 3;
      var p1x = vertices[idx+0], p1y = vertices[idx+1], p1z = vertices[idx+2];
      idx = i * 9 + 2 * 3;
      var p2x = vertices[idx+0], p2y = vertices[idx+1], p2z = vertices[idx+2];

      var ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
      var vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;

      var nx = uy*vz - uz*vy;
      var ny = uz*vx - ux*vz;
      var nz = ux*vy - uy*vx;

      var norm = Math.sqrt(nx*nx + ny*ny + nz*nz);
      nx = nx / norm;
      ny = ny / norm;
      nz = nz / norm;

      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  }
  return normals;
}

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 180, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var lightMatrix;
var normalMatrix;
var nVertex;


var battleship_mvpMatrix;
var battleship_modelMatrix;
var battleship_normalMatrix;
var battleship_objScale = 0.5 ;
var battleship_objComponents = [];
var battleship_textures = {};
var battleship_imgNames = ["./battleship/battleship_texture.png"];
var battleship_objComponentIndex = ["./battleship/battleship_texture.png", "./battleship/battleship_texture.png", "./battleship/battleship_texture.png"];
var battleship_texCount = 0 ;
var battleship_numTextures = battleship_imgNames.length;
var rotating = 0;

var fox_mvpMatrix;
var fox_modelMatrix;
var fox_normalMatrix;
var fox_objScale = 0.008 ;
var fox_objComponents = [];
var fox_textures = {};
var fox_imgNames = ["./fox/fox_texture.png"];
var fox_objComponentIndex = ["./fox/fox_texture.png"];
var fox_texCount = 0 ;
var fox_numTextures = fox_imgNames.length;

var steve_mvpMatrix;
var steve_modelMatrix;
var steve_normalMatrix;
var steve_objScale = 0.1 ;
var steve_objComponents = [];
var steve_textures = {};
var steve_imgNames = ["./steve/Steve_texture.png"];
var steve_objComponentIndex = ["./steve/Steve_texture.png", "./steve/Steve_texture.png", "./steve/Steve_texture.png", "./steve/Steve_texture.png", "./steve/Steve_texture.png", "./steve/Steve_texture.png"];
var steve_texCount = 0 ;
var steve_numTextures = steve_imgNames.length;

var dolphin_mvpMatrix;
var dolphin_modelMatrix;
var dolphin_normalMatrix;
var dolphin_objScale = 0.1 ;
var dolphin_objComponents = [];
var dolphin_textures = {};
var dolphin_imgNames = ["./dolphin/dolphin_texture.jpg"];
var dolphin_objComponentIndex = ["./dolphin/dolphin_texture.jpg"];
var dolphin_texCount = 0 ;
var dolphin_numTextures = dolphin_imgNames.length;


var cameraX = 0, cameraY = 0.86, cameraZ = 2.2;
var lightX = 0, lightY = 5, lightZ = 3;
var cameraDirX = 0, cameraDirY = 0, cameraDirZ = 1;
var cube = [];
var cubeObj = [];
var textures = {};
var texCount = 0 ;
var numTexture = 1;
var quadObj;
var cubeMapTex;
var newViewDir = new Vector3();
var staX = 0, staY = 0, staZ = 0;//static camera look at

var moving_camera = 0  ;
var speed = 1;
var tempspeed = 0 ;
var fbo;
var offScreenWidth = 800, offScreenHeight = 800;
var vpFromCameraInverse = new Matrix4();

async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    var quad = new Float32Array(
      [
        -1, -1, 1,
         1, -1, 1,
        -1,  1, 1,
        -1,  1, 1,
         1, -1, 1,
         1,  1, 1
      ]); //just a quad

    programEnvCube = compileShader(gl, VSHADER_SOURCE_ENVCUBE, FSHADER_SOURCE_ENVCUBE);
    gl.useProgram(programEnvCube);
    programEnvCube.a_Position = gl.getAttribLocation(programEnvCube, 'a_Position'); 
    programEnvCube.u_envCubeMap = gl.getUniformLocation(programEnvCube, 'u_envCubeMap'); 
    programEnvCube.u_viewDirectionProjectionInverse = gl.getUniformLocation(programEnvCube, 'u_viewDirectionProjectionInverse'); 
    quadObj = initVertexBufferForLaterUse(gl, quad);
    cubeMapTex = initCubeTexture("pos-x.jpg", "neg-x.jpg", "pos-y.jpg", "neg-y.jpg", "pos-z.jpg", "neg-z.jpg", 2048, 2048);
    

    programTexture = compileShader(gl, VSHADER_SOURCE_TEXTURE, FSHADER_SOURCE_TEXTURE);
    gl.useProgram(programTexture);            
    programTexture.a_Position = gl.getAttribLocation(programTexture, 'a_Position'); 
    programTexture.a_TexCoord = gl.getAttribLocation(programTexture, 'a_TexCoord'); 
    programTexture.a_Normal = gl.getAttribLocation(programTexture, 'a_Normal'); 
    programTexture.u_MvpMatrix = gl.getUniformLocation(programTexture, 'u_MvpMatrix'); 
    programTexture.u_modelMatrix = gl.getUniformLocation(programTexture, 'u_modelMatrix'); 
    programTexture.u_normalMatrix = gl.getUniformLocation(programTexture, 'u_normalMatrix');
    programTexture.u_LightPosition = gl.getUniformLocation(programTexture, 'u_LightPosition');
    programTexture.u_ViewPosition = gl.getUniformLocation(programTexture, 'u_ViewPosition');
    programTexture.u_Ka = gl.getUniformLocation(programTexture, 'u_Ka'); 
    programTexture.u_Kd = gl.getUniformLocation(programTexture, 'u_Kd');
    programTexture.u_Ks = gl.getUniformLocation(programTexture, 'u_Ks');
    programTexture.u_shininess = gl.getUniformLocation(programTexture, 'u_shininess');
    programTexture.u_Sampler = gl.getUniformLocation(programTexture, "u_Sampler")

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    gl.useProgram(program);
    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_lightMatrix = gl.getUniformLocation(program, 'u_lightMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_Color = gl.getUniformLocation(program, 'u_Color'); 

    programBump = compileShader(gl, VSHADER_SOURCE_BUMP, FSHADER_SOURCE_BUMP);
    programBump.a_Position = gl.getAttribLocation(programBump, 'a_Position'); 
    programBump.a_Normal = gl.getAttribLocation(programBump, 'a_Normal'); 
    programBump.a_TexCoord = gl.getAttribLocation(programBump, 'a_TexCoord'); 
    programBump.a_Tagent = gl.getAttribLocation(programBump, 'a_Tagent'); 
    programBump.a_Bitagent = gl.getAttribLocation(programBump, 'a_Bitagent'); 
    programBump.a_crossTexCoord = gl.getAttribLocation(programBump, 'a_crossTexCoord'); 
    programBump.u_MvpMatrix = gl.getUniformLocation(programBump, 'u_MvpMatrix'); 
    programBump.u_modelMatrix = gl.getUniformLocation(programBump, 'u_modelMatrix'); 
    programBump.u_normalMatrix = gl.getUniformLocation(programBump, 'u_normalMatrix');
    programBump.u_LightPosition = gl.getUniformLocation(programBump, 'u_LightPosition');
    programBump.u_ViewPosition = gl.getUniformLocation(programBump, 'u_ViewPosition');
    programBump.u_Ka = gl.getUniformLocation(programBump, 'u_Ka'); 
    programBump.u_Kd = gl.getUniformLocation(programBump, 'u_Kd');
    programBump.u_Ks = gl.getUniformLocation(programBump, 'u_Ks');
    programBump.u_Color = gl.getUniformLocation(programBump, 'u_Color');
    programBump.u_shininess = gl.getUniformLocation(programBump, 'u_shininess');
    programBump.u_Sampler0 = gl.getUniformLocation(programBump, 'u_Sampler0');

    programRefla = compileShader(gl, VSHADER_SOURCE_REFLA, FSHADER_SOURCE_REFLA);
    programRefla.a_Position = gl.getAttribLocation(programRefla, 'a_Position'); 
    programRefla.a_Normal = gl.getAttribLocation(programRefla, 'a_Normal'); 
    programRefla.u_MvpMatrix = gl.getUniformLocation(programRefla, 'u_MvpMatrix'); 
    programRefla.u_modelMatrix = gl.getUniformLocation(programRefla, 'u_modelMatrix'); 
    programRefla.u_normalMatrix = gl.getUniformLocation(programRefla, 'u_normalMatrix');
    programRefla.u_ViewPosition = gl.getUniformLocation(programRefla, 'u_ViewPosition');
    programRefla.u_envCubeMap = gl.getUniformLocation(programRefla, 'u_envCubeMap');


    ///// cube
    response = await fetch('cube.obj');
      text = await response.text();
      obj = parseOBJ(text);
      for( let i=0; i < obj.geometries.length; i ++ ){
        let o = initVertexBufferForLaterUse(gl, 
                                            obj.geometries[i].data.position,
                                            obj.geometries[i].data.normal, 
                                            obj.geometries[i].data.texcoord);
        cubeObj.push(o);
      }

    /////3D model battleship
    response = await fetch('battleship/battleship.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      battleship_objComponents.push(o);
    }

    for( let i=0; i < battleship_imgNames.length; i ++ ){
      let image = new Image();
      image.onload = function(){initTexture(gl, image, battleship_imgNames[i], 
                                            battleship_textures, battleship_texCount, battleship_numTextures);};
      image.src = battleship_imgNames[i];
    }

    /////3D model fox
    response = await fetch('fox/fox.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      fox_objComponents.push(o);
    }

    for( let i=0; i < fox_imgNames.length; i ++ ){
      let image = new Image();
      image.onload = function(){initTexture(gl, image, fox_imgNames[i], 
                                            fox_textures, fox_texCount, fox_numTextures);};
      image.src = fox_imgNames[i];
    }

    response = await fetch('steve/steve.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      steve_objComponents.push(o);
    }

    for( let i=0; i < steve_imgNames.length; i ++ ){
      let image = new Image();
      image.onload = function(){initTexture(gl, image, steve_imgNames[i], 
        steve_textures, steve_texCount, steve_numTextures);};
      image.src = steve_imgNames[i];
    }

    response = await fetch('dolphin/dolphin.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      dolphin_objComponents.push(o);
    }

    for( let i=0; i < dolphin_imgNames.length; i ++ ){
      let image = new Image();
      image.onload = function(){initTexture(gl, image, dolphin_imgNames[i], 
        dolphin_textures, dolphin_texCount, dolphin_numTextures);};
      image.src = dolphin_imgNames[i];
    }


    foxObj = await loadOBJtoCreateBumpVBO('fox/fox.obj');
    cubeForBumpObj = await loadOBJtoCreateBumpVBO('cube.obj');
    var normalMapImage = new Image();
    normalMapImage.onload = function(){initTextureBump(gl, normalMapImage, "normalMapImage");};
    normalMapImage.src = "normalMap.jpeg";

    var oceanMapImage = new Image();
    oceanMapImage.onload = function(){initTextureBump(gl, oceanMapImage, "oceanMapImage");};
    oceanMapImage.src = "oceanMap.jpeg";

    ////cube
    //TODO-1: create vertices for the cube whose edge length is 2.0 (or 1.0 is also fine)
    //F: Face, T: Triangle
    cubeVertices = [
       1.0, 1.0, 1.0,-1.0, 1.0, 1.0, 1.0,-1.0, 1.0,-1.0,-1.0, 1.0, 1.0,-1.0, 1.0,-1.0, 1.0, 1.0,     //this row for the face z = 1.0.0
       1.0, 1.0, 1.0, 1.0,-1.0, 1.0, 1.0, 1.0,-1.0, 1.0,-1.0,-1.0, 1.0, 1.0,-1.0, 1.0,-1.0, 1.0,     //this row for the face x = 1.0.0
       1.0, 1.0, 1.0, 1.0, 1.0,-1.0,-1.0, 1.0, 1.0,-1.0, 1.0,-1.0,-1.0, 1.0, 1.0, 1.0, 1.0,-1.0,       //this row for the face y = 1.0.0
      -1.0, 1.0, 1.0,-1.0, 1.0,-1.0,-1.0,-1.0, 1.0,-1.0,-1.0,-1.0,-1.0,-1.0, 1.0,-1.0, 1.0,-1.0,       //this row for the face x = -1.0.0
       1.0,-1.0, 1.0,-1.0,-1.0, 1.0, 1.0,-1.0,-1.0,-1.0,-1.0,-1.0, 1.0,-1.0,-1.0,-1.0,-1.0, 1.0,           //this row for the face y = -1.0.0
       1.0, 1.0,-1.0, 1.0,-1.0,-1.0,-1.0, 1.0,-1.0,-1.0,-1.0,-1.0,-1.0, 1.0,-1.0, 1.0,-1.0,-1.0   //this row for the face z = -1.0.0
    ];
    cubeNormals = getNormalOnVertices(cubeVertices);
    let o = initVertexBufferForLaterUse(gl, cubeVertices, cubeNormals, null);
    cube.push(o);

    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    lightMatrix = new Matrix4();
    normalMatrix = new Matrix4();

    battleship_mvpMatrix = new Matrix4();
    battleship_modelMatrix = new Matrix4();
    battleship_normalMatrix = new Matrix4();

    fox_mvpMatrix = new Matrix4();
    fox_modelMatrix = new Matrix4();
    fox_normalMatrix = new Matrix4();

    steve_mvpMatrix = new Matrix4();
    steve_modelMatrix = new Matrix4();
    steve_normalMatrix = new Matrix4();

    dolphin_mvpMatrix = new Matrix4();
    dolphin_modelMatrix = new Matrix4();
    dolphin_normalMatrix = new Matrix4();

    vpFromCameraInverse = new Matrix4();

    gl.enable(gl.DEPTH_TEST);

    fbo = initFrameBuffer(gl);
      
    // draw();//draw it once before mouse move
    // drawAll();
    var tick = function() {
      drawAll();
      rotating += 1*speed;
      
      requestAnimationFrame(tick);
    }
    tick();

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};
    document.onkeydown = function(ev){keydown(ev)};
}

function drawAll(){
  // moving_camera = 1;
  draw();
  // gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  // gl.viewport(0, 0, offScreenWidth, offScreenHeight);
  
  // var oriX = cameraX, oriY = cameraY, oriZ = cameraZ;
  // var oriAX = angleX, oriAY = angleY;
  // cameraX = 3, cameraY = 2, cameraZ = 4;
  // //3.9027775801252584 3.8947608091053554 6.31559872031212
  // staX = 0, staY = 0, staZ = 0;
  // //-0.5807029604911804, -0.20899248123168945, -0.786
  // // moving_camera = 0 ;
  // // draw();
  // cameraX = oriX, cameraY = oriY, cameraZ = oriZ;
  // angelX = oriAX, angleY = oriAY;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  // drawOnScreen();
}

/////Call drawOneObject() here to draw all object one by one 
////   (setup the model matrix and color to draw)
function draw(){
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);

    //===================ROTATE===================
    let rotateMatrix = new Matrix4();
    rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
    rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
    viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
    newViewDir = rotateMatrix.multiplyVector3(viewDir);
    //===================ROTATE===================

    gl.useProgram(program);
    
    // //cube (light)
    // mdlMatrix.setRotate(0, 1, 1, 1);
    // mdlMatrix.translate(0, 5, 3);
    // mdlMatrix.scale(0.1 , 0.1 , 0.1 );
    // drawOneObject(cube, mdlMatrix, 0.0, 1.0, 1.0, newViewDir);
    //Cube (ground)
    //TODO-1: set mdlMatrix for the cube 
    mdlMatrix.setRotate(0, 1, 1, 1);
    
    mdlMatrix.translate(0, -0.1, 0);
    mdlMatrix.scale(3.0, 0.2, 3.0);
    // drawOneObject(cube, mdlMatrix, 0.0, 0.9, 1.0, newViewDir);

    mdlMatrix.setRotate(0, 1, 1, 1);
    mdlMatrix.translate(0, -0.02, -0.2);
    if(rotating%61 <= 30){
      mdlMatrix.translate(0, (rotating%61-15)/1000, 0)
    }
    else{
      mdlMatrix.translate(0, (60-rotating%61-15)/1000, 0)
    }
    mdlMatrix.scale(0.5, 0.2, 0.5);
    
    drawOneObject(cube, mdlMatrix, 0.9, 0.73, 0.56, newViewDir);
    
    // pushMatrix();

    // //battleship
    // //TODO-2: set mdlMatrix for battleship
    gl.useProgram(programTexture);
    battleship_modelMatrix = new Matrix4();
    battleship_modelMatrix.setRotate(rotating, 0, 1, 0);
    battleship_modelMatrix.scale(battleship_objScale, battleship_objScale, battleship_objScale);
    battleship_modelMatrix.translate(-5.0, 0.4, -0.5);
    battleship_modelMatrix.rotate(270, 0, 1, 0);
    if(rotating%31 <= 15){
      battleship_modelMatrix.rotate(rotating%31-7.5, 1, 0, 0)
    }
    else{
      battleship_modelMatrix.rotate(30-rotating%31-7.5, 1, 0, 0)
    }
    
    drawOneTextureObject(battleship_modelMatrix,
      battleship_textures, battleship_objComponents, battleship_objComponentIndex, newViewDir);
    
    battleship_modelMatrix.translate(0.0, 0.7, 0.0)  
    battleship_modelMatrix.scale(0.04, 0.04, 0.04)
    drawOneTextureObject(battleship_modelMatrix,
      steve_textures, steve_objComponents, steve_objComponentIndex, newViewDir);
  
    dolphin_modelMatrix = new Matrix4();
    dolphin_modelMatrix.setRotate(rotating-45, 0, 1, 0);
    dolphin_modelMatrix.scale(dolphin_objScale*5, dolphin_objScale*5, dolphin_objScale*5);
    dolphin_modelMatrix.translate(-5.5, -0.0, -0.5);
    dolphin_modelMatrix.rotate(0, 0, 1, 0);
    dolphin_modelMatrix.rotate(-15, 1, 0, 0);
    if(rotating%31 <= 15){
      dolphin_modelMatrix.rotate((rotating%31-7.5), -1, 0, 0)
    }
    else{
      dolphin_modelMatrix.rotate((30-rotating%31-7.5), -1, 0, 0)
    }
    drawOneTextureObject(dolphin_modelMatrix,
      dolphin_textures, dolphin_objComponents, dolphin_objComponentIndex, newViewDir);

    
    //fox
    fox_modelMatrix = new Matrix4();
    fox_modelMatrix.setRotate(0, 1, 1, 1);
    fox_modelMatrix.rotate(0, 0, 1, 0)
    fox_modelMatrix.translate(0, 0.15, 0.0);
    if(rotating%61 <= 30){
      fox_modelMatrix.translate(0, (rotating%61-15)/1000, 0)
    }
    else{
      fox_modelMatrix.translate(0, (60-rotating%61-15)/1000, 0)
    }
    fox_modelMatrix.scale(fox_objScale, fox_objScale, fox_objScale);
    drawOneTextureObject(fox_modelMatrix,
      fox_textures, fox_objComponents, fox_objComponentIndex, newViewDir);
    
    steve_modelMatrix = new Matrix4();
    steve_modelMatrix.setRotate(0, 0, 1, 0);
    steve_modelMatrix.translate(cameraX, cameraY-0.8, cameraZ);
    steve_modelMatrix.rotate(90, 0, 1, 0);
    steve_modelMatrix.rotate(angleX+180, 0, 1, 0);
    // steve_modelMatrix.rotate(-angleY, 1, 0, 0);
    steve_modelMatrix.scale(steve_objScale, steve_objScale, steve_objScale);
    drawOneTextureObject(steve_modelMatrix,
      steve_textures, steve_objComponents, steve_objComponentIndex, newViewDir);
    
    // steve_modelMatrix.translate(-1, -0.0, 0.6);
    // steve_modelMatrix.rotate(90, 0, 1, 0);
    // steve_modelMatrix.scale(steve_objScale*100, steve_objScale*100, steve_objScale*100);
    // drawOneTextureObject(steve_modelMatrix,
    //   dolphin_textures, dolphin_objComponents, dolphin_objComponentIndex, newViewDir);
  

    var vpFromCamera = new Matrix4();
    vpFromCamera.setPerspective(60, 1, 1, 15);
    var viewMatrixRotationOnly = new Matrix4();
    if(moving_camera == 0){
      viewMatrixRotationOnly.lookAt(3, 2, 4, staX, staY, staZ, 0, 1, 0)
    }
    else{
      viewMatrixRotationOnly.lookAt(cameraX, cameraY, cameraZ, 
                                  cameraX + newViewDir.elements[0], 
                                  cameraY + newViewDir.elements[1], 
                                  cameraZ + newViewDir.elements[2], 
                                  0, 1, 0);
      }
    viewMatrixRotationOnly.elements[12] = 0; //ignore translation
    viewMatrixRotationOnly.elements[13] = 0;
    viewMatrixRotationOnly.elements[14] = 0;
    vpFromCamera.multiply(viewMatrixRotationOnly);
    vpFromCameraInverse = vpFromCamera.invert();
    //
    mvpMatrix.setPerspective(60, 1, 1, 15);
    if(moving_camera == 0){
      mvpMatrix.lookAt(3, 2, 4, staX, staY, staZ, 0, 1, 0)
    }
    else{
      mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 
        cameraX + newViewDir.elements[0], 
        cameraY + newViewDir.elements[1], 
        cameraZ + newViewDir.elements[2], 
        0, 1, 0);
    }
    mvpMatrix.multiply(modelMatrix);

    //normal matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    //stone fox
    let vpMatrix = new Matrix4();
    vpMatrix.setPerspective(60, 1, 1, 15);
    if(moving_camera == 0){
      vpMatrix.lookAt(3, 2, 4, staX, staY, staZ, 0, 1, 0)
    }
    else{
      vpMatrix.lookAt(cameraX, cameraY, cameraZ, 
        cameraX + newViewDir.elements[0], 
        cameraY + newViewDir.elements[1], 
        cameraZ + newViewDir.elements[2], 
        0, 1, 0);
    }
    mdlMatrix.setRotate(0, 1, 0, 0);//for mouse rotation
    mdlMatrix.rotate(15, 0, 1, 0);//for mouse rotation
    mdlMatrix.translate(0.3, 0.15, 0.0)
    if(rotating%61 <= 30){
      mdlMatrix.translate(0, (rotating%61-15)/1000, 0)
    }
    else{
      mdlMatrix.translate(0, (60-rotating%61-15)/1000, 0)
    }
    mdlMatrix.scale(fox_objScale, fox_objScale, fox_objScale);
    drawOneRegularObject(foxObj, mdlMatrix, vpMatrix, 0.5, 0.5, 0.5,"normalMapImage");
    
    mdlMatrix.setRotate(0, 1, 0, 0);//for mouse rotation
    mdlMatrix.rotate(0, 0, 1, 0);//for mouse rotation
    mdlMatrix.translate(0.0, -2.9, 0.0)
    mdlMatrix.scale(3.0, 3.0, 3.0)
    drawOneRegularObject(cubeForBumpObj, mdlMatrix, vpMatrix, 0.0, 0.9, 1.0,"oceanMapImage");
    
    

    //quad
    // console.log(vpFromCameraInverse.elements);
    drawEnvMap(vpFromCameraInverse)
    
    gl.useProgram(programRefla);
    gl.depthFunc(gl.LESS);
    // model Matrix (part of the mvp matrix)
    modelMatrix = new Matrix4();
    modelMatrix.setRotate(0, 1, 1, 1);
    modelMatrix.translate(0, 0.1, 1);
    modelMatrix.scale(fox_objScale, fox_objScale, fox_objScale);
    
    //mvp: projection * view * model matrix  
    mvpMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    vpMatrix.setPerspective(60, 1, 1, 15);
    if(moving_camera == 0){
      vpMatrix.lookAt(3, 2, 4, staX, staY, staZ, 0, 1, 0)
    }
    else{
      vpMatrix.lookAt(cameraX, cameraY, cameraZ, 
        cameraX + newViewDir.elements[0], 
        cameraY + newViewDir.elements[1], 
        cameraZ + newViewDir.elements[2], 
        0, 1, 0);
    }
    fox_modelMatrix.setRotate(0, 1, 1, 1);
    fox_modelMatrix.rotate(-15, 0, 1, 0)
    fox_modelMatrix.translate(-0.3, 0.15, 0.0);
    if(rotating%61 <= 30){
      fox_modelMatrix.translate(0, (rotating%61-15)/1000, 0)
    }
    else{
      fox_modelMatrix.translate(0, (60-rotating%61-15)/1000, 0)
    }
    fox_modelMatrix.scale(fox_objScale, fox_objScale, fox_objScale);
    
    mvpMatrix.set(projMatrix).multiply(vpMatrix).multiply(fox_modelMatrix);

    //normal matrix
    normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    
    gl.uniform3f(programRefla.u_ViewPosition, cameraX, cameraY, cameraZ);
    if(moving_camera == 0){
      gl.uniform3f(programRefla.u_ViewPosition, 3, 2, 4);
    }
    gl.uniform1i(programRefla.u_envCubeMap, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);

    gl.uniformMatrix4fv(programRefla.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(programRefla.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(programRefla.u_normalMatrix, false, normalMatrix.elements);

    for( let i=0; i < fox_objComponents.length; i ++ ){
      initAttributeVariable(gl, programRefla.a_Position, fox_objComponents[i].vertexBuffer);
      initAttributeVariable(gl, programRefla.a_Normal, fox_objComponents[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, fox_objComponents[i].numVertices);
    }

}

function drawEnvMap(vpFromCameraInverse){
  gl.useProgram(programEnvCube);
    gl.depthFunc(gl.LEQUAL);
    gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, 
                      false, vpFromCameraInverse.elements);
    // console.log(vpFromCameraInverse.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);
    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices)
}

//obj: the object components
//mdlMatrix: the model matrix without mouse rotation
//colorR, G, B: object color
function drawOneObject(obj, mdlMatrix, colorR, colorG, colorB, newViewDir){
    //model Matrix (part of the mvp matrix)
    gl.useProgram(program);

    let modelMatrix = new Matrix4();
    let mvpMatrix = new Matrix4();
    let normalMatrix = new Matrix4();
    let lightMatrix = new Matrix4();
    
    modelMatrix.setRotate(0, 1, 0, 0);//for mouse rotation
    modelMatrix.multiply(mdlMatrix);
    //mvp: projection * view * model matrix  
    mvpMatrix.setPerspective(60, 1, 1, 15);

    if(moving_camera == 0){
      mvpMatrix.lookAt(3, 2, 4, staX, staY, staZ, 0, 1, 0);
    }
    else{
      mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 
        cameraX + newViewDir.elements[0], 
        cameraY + newViewDir.elements[1], 
        cameraZ + newViewDir.elements[2], 
        0, 1, 0);
    }
    mvpMatrix.multiply(modelMatrix);

    //normal matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    lightMatrix.setRotate(0, 1, 0, 0);//for mouse rotation
    // lightMatrix.scale(0.1, 0.1, 0.1);

    gl.uniform4f(program.u_LightPosition, 0, 5, 3, 1);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 0.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);


    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(program.u_lightMatrix, false, lightMatrix.elements);

    for( let i=0; i < obj.length; i ++ ){
      initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
      initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
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
        angleY += dy;//dy;
        angleY *= moving_camera;
    }
    mouseLastX = x;
    mouseLastY = y;

    drawAll();
}

function initCubeTexture(posXName, negXName, posYName, negYName, 
  posZName, negZName, imgWidth, imgHeight)
{
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      fName: posXName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      fName: negXName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      fName: posYName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      fName: negYName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      fName: posZName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      fName: negZName,
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, fName} = faceInfo;
    // setup each face so it's immediately renderable
    gl.texImage2D(target, 0, gl.RGBA, imgWidth, imgHeight, 0, 
                  gl.RGBA, gl.UNSIGNED_BYTE, null);

    var image = new Image();
    image.onload = function(){
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    };
    image.src = fName;
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  return texture;
}

function keydown(ev){ 
  //implment keydown event here
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);

  if(ev.key == 'w'){ 
      cameraX += (newViewDir.elements[0] * 0.1);
      cameraY += (newViewDir.elements[1] * 0.1);
      cameraZ += (newViewDir.elements[2] * 0.1);
  }
  else if(ev.key == 's'){ 
    cameraX -= (newViewDir.elements[0] * 0.1);
    cameraY -= (newViewDir.elements[1] * 0.1);
    cameraZ -= (newViewDir.elements[2] * 0.1);
  }
  else if(ev.key == '`'){
    moving_camera = (moving_camera==0);
    angleY *= moving_camera;
  }
  else if(ev.key == 'e'){
    cameraY += 0.03;
  }
  else if(ev.key == 'd'){
    cameraY -= 0.03;
  }
  else if(ev.key == 'r'){
    cameraX = 0;
    cameraY = 0.86;
    cameraZ = 2.2;
    angleX = 180 ;
    angleY = 0 ;
    speed = 1;
  }
  else if(ev.key == '+'){
    speed += 0.1;
  }
  else if(ev.key == '-'){
    speed -= 0.1;
  }
  else if(ev.key == 'p'){
    var temp = tempspeed;
    tempspeed = speed;
    speed = temp;
  }

  console.log(cameraX, cameraY, cameraZ)
  drawAll();
}

function initTexture(gl, img, imgName, textures, texCount, numTextures){
  var tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Set the parameters so we can render any size image.
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

  textures[imgName] = tex;

  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  texCount++;
  if( texCount == numTextures)drawAll();
} 

function drawOnScreen(){
  //gl.clearColor(0,0,0,1);
  gl.useProgram(programTexture);

  //model Matrix (part of the mvp matrix)
  modelMatrix.setRotate(0, 1, 1, 1);//for mouse rotation
  modelMatrix.translate(0.0, 2.0, -1.2);
  modelMatrix.scale(1.0, 1.0, 0.005);

  //mvp: projection * view * model matrix  
  mvpMatrix.setPerspective(60, 1, 1, 15);
  mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 
    cameraX + newViewDir.elements[0], 
    cameraY + newViewDir.elements[1], 
    cameraZ + newViewDir.elements[2], 
    0, 1, 0);
  mvpMatrix.multiply(modelMatrix);

  //normal matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(programTexture.u_LightPosition, 0, 1, 3);
  gl.uniform3f(programTexture.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1f(programTexture.u_Ka, 0.2);
  gl.uniform1f(programTexture.u_Kd, 0.7);
  gl.uniform1f(programTexture.u_Ks, 0);
  gl.uniform1f(programTexture.u_shininess, 10.0);
  gl.uniform1i(programTexture.u_Sampler0, 0);

  gl.uniformMatrix4fv(programTexture.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(programTexture.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(programTexture.u_normalMatrix, false, normalMatrix.elements);

  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

  for( let i=0; i < cubeObj.length; i ++ ){
    initAttributeVariable(gl, programTexture.a_Position, cubeObj[i].vertexBuffer);
    initAttributeVariable(gl, programTexture.a_TexCoord, cubeObj[i].texCoordBuffer);
    initAttributeVariable(gl, programTexture.a_Normal, cubeObj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, cubeObj[i].numVertices);
  }
}

function initFrameBuffer(gl){
  //create and set up a texture object as the color buffer
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, offScreenWidth, offScreenHeight,
                  0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  

  //create and setup a render buffer as the depth buffer
  var depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                          offScreenWidth, offScreenHeight);

  //create and setup framebuffer: linke the color and depth buffer to it
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                              gl.RENDERBUFFER, depthBuffer);
  frameBuffer.texture = texture;
  return frameBuffer;
}

function drawOneTextureObject(_modelMatrix, textures, objComponents, objComponentIndex, newViewDir){
  var _mvpMatrix = new Matrix4();
  _mvpMatrix.setPerspective(60, 1, 1, 15);
  if(moving_camera == 0){
    _mvpMatrix.lookAt(3, 2, 4, staX, staY, staZ, 0, 1, 0);
  }
  else{
    _mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 
      cameraX + newViewDir.elements[0], 
      cameraY + newViewDir.elements[1], 
      cameraZ + newViewDir.elements[2], 
      0, 1, 0);
  }
    
    _mvpMatrix.multiply(_modelMatrix);

    //normal matrix
  var _normalMatrix = new Matrix4();
  _normalMatrix.setInverseOf(_modelMatrix);
  _normalMatrix.transpose();
  gl.useProgram(programTexture);
  gl.uniform3f(programTexture.u_LightPosition, 0, 5, 3);
  gl.uniform1f(programTexture.u_Ka, 0.2);
  gl.uniform1f(programTexture.u_Kd, 0.7);
  gl.uniform1f(programTexture.u_Ks, 1.0);
  if(textures == steve_textures){
    gl.uniform1f(programTexture.u_Ks, 0.0)
  }
  gl.uniform1f(programTexture.u_shininess, 10.0);
  gl.uniformMatrix4fv(programTexture.u_MvpMatrix, false, _mvpMatrix.elements);
  gl.uniformMatrix4fv(programTexture.u_modelMatrix, false, _modelMatrix.elements);
  gl.uniformMatrix4fv(programTexture.u_normalMatrix, false, _normalMatrix.elements);
  for(let i = 0 ; i < objComponents.length ; i ++){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[objComponentIndex[i]]);
    gl.uniform1i(programTexture.u_Sampler, 0);
    initAttributeVariable(gl, programTexture.a_Position, objComponents[i].vertexBuffer);
    initAttributeVariable(gl, programTexture.a_TexCoord, objComponents[i].texCoordBuffer);
    initAttributeVariable(gl, programTexture.a_Normal, objComponents[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, objComponents[i].numVertices);
  }
}

function drawOneRegularObject(obj, modelMatrix, vpMatrix, colorR, colorG, colorB, img){
  gl.useProgram(programBump);
  let mvpMatrix = new Matrix4();
  let normalMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);

  //normal matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(programBump.u_LightPosition, lightX, lightY, lightZ);
  gl.uniform3f(programBump.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1f(programBump.u_Ka, 0.2);
  gl.uniform1f(programBump.u_Kd, 0.7);
  gl.uniform1f(programBump.u_Ks, 1.0);
  gl.uniform1f(programBump.u_shininess, 40.0);
  if(moving_camera == 0){
    gl.uniform3f(programBump.u_ViewPosition, 3, 2, 4);
  }
  gl.uniform3f(programBump.u_Color, colorR, colorG, colorB);
  gl.uniform1i(programBump.u_Sampler0, 0);
  gl.uniform1i(programBump.u_Sampler1, 1);

  gl.uniformMatrix4fv(programBump.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(programBump.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(programBump.u_normalMatrix, false, normalMatrix.elements);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[img]);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, programBump.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, programBump.a_Normal, obj[i].normalBuffer);
    initAttributeVariable(gl, programBump.a_TexCoord, obj[i].texCoordBuffer);
    initAttributeVariable(gl, programBump.a_Tagent, obj[i].tagentsBuffer);
    initAttributeVariable(gl, programBump.a_Bitagent, obj[i].bitagentsBuffer);
    initAttributeVariable(gl, programBump.a_crossTexCoord, obj[i].crossTexCoordsBuffer);
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

async function loadOBJtoCreateBumpVBO( objFile ){
  let objComponents = [];
  response = await fetch(objFile);
  text = await response.text();
  obj = parseOBJ(text);
  for( let i=0; i < obj.geometries.length; i ++ ){
    let tagentSpace = calculateTangentSpace(obj.geometries[i].data.position, 
                                            obj.geometries[i].data.texcoord);
    let o = initVertexBufferForLaterUseBump(gl, 
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

function drawObjectWithDynamicReflection(obj, modelMatrix, vpMatrix, colorR, colorG, colorB){
  gl.useProgram(programTextureOnCube);
  let mvpMatrix = new Matrix4();
  let normalMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);

  //normal matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(programTextureOnCube.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform3f(programTextureOnCube.u_Color, colorR, colorG, colorB);

  gl.uniformMatrix4fv(programTextureOnCube.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(programTextureOnCube.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(programTextureOnCube.u_normalMatrix, false, normalMatrix.elements);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, fbo.texture);
  gl.uniform1i(programTextureOnCube.u_envCubeMap, 0);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, programTextureOnCube.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, programTextureOnCube.a_Normal, obj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
}

async function loadOBJtoCreateVBO( objFile ){
  let objComponents = [];
  response = await fetch(objFile);
  text = await response.text();
  obj = parseOBJ(text);
  for( let i=0; i < obj.geometries.length; i ++ ){
    let o = initVertexBufferForLaterUse(gl, 
                                        obj.geometries[i].data.position,
                                        obj.geometries[i].data.normal, 
                                        obj.geometries[i].data.texcoord);
    objComponents.push(o);
  }
  return objComponents;
}

function initFrameBufferForCubemapRendering(gl){
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  // 6 2D textures
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  for (let i = 0; i < 6; i++) {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, 
                  gl.RGBA, offScreenWidth, offScreenHeight, 0, gl.RGBA, 
                  gl.UNSIGNED_BYTE, null);
  }

  //create and setup a render buffer as the depth buffer
  var depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                          offScreenWidth, offScreenHeight);

  //create and setup framebuffer: linke the depth buffer to it (no color buffer here)
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                              gl.RENDERBUFFER, depthBuffer);

  frameBuffer.texture = texture;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return frameBuffer;
}



function renderCubeMap(camX, camY, camZ)
{
  //camera 6 direction to render 6 cubemap faces
  var ENV_CUBE_LOOK_DIR = [
      [1.0, 0.0, 0.0],
      [-1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, -1.0, 0.0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0, -1.0]
  ];

  //camera 6 look up vector to render 6 cubemap faces
  var ENV_CUBE_LOOK_UP = [
      [0.0, -1.0, 0.0],
      [0.0, -1.0, 0.0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0, -1.0],
      [0.0, -1.0, 0.0],
      [0.0, -1.0, 0.0]
  ];

  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, offScreenWidth, offScreenHeight);
  gl.clearColor(0.4, 0.4, 0.4,1);
  for (var side = 0; side < 6;side++){
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_CUBE_MAP_POSITIVE_X+side, fbo.texture, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let vpMatrix = new Matrix4();
    vpMatrix.setPerspective(90, 1, 1, 100);
    vpMatrix.lookAt(camX, camY, camZ,   
                    camX + ENV_CUBE_LOOK_DIR[side][0], 
                    camY + ENV_CUBE_LOOK_DIR[side][1],
                    camZ + ENV_CUBE_LOOK_DIR[side][2], 
                    ENV_CUBE_LOOK_UP[side][0],
                    ENV_CUBE_LOOK_UP[side][1],
                    ENV_CUBE_LOOK_UP[side][2]);
    drawRegularObjects(vpMatrix);
    
    vpFromCameraInverse = vpMatrix.invert();
    drawEnvMap();
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  drawEnvMap();
}

function initTextureBump(gl, img, texKey){
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

  textures[texKey] = tex;

  // texCount++;
  // if( texCount == numTextures)
  drawAll();
}