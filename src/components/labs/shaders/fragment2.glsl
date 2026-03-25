#version 300 es
precision mediump float;

out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_audio[64];

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;

    int idx = int(floor(st.x * 64.0));
    float bar = u_audio[idx] / 255.0;
    float color = step(st.y, bar);

    outColor = vec4(0.0, 0.0, color, 1);
}
