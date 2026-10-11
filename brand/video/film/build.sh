#!/usr/bin/env bash
# Cuts the brand film (16:9; pass --vertical for the 9:16 cut) from s1.mp4 ... s5.mp4 (the generated scenes), the logo intro,
# the caption cards, vo.wav (the raw voiceover) and music.wav. Needs ffmpeg.
set -euo pipefail

if [[ "${1:-}" == --vertical ]]; then
  W=1080; H=1920; INTRO=../intro-vertical-light.mp4; OUT=sortnow-learn-brand-film-vertical.mp4; DIR=(1 1 1 1 1)
else
  W=1920; H=1080; INTRO=../intro-landscape-light.mp4; OUT=sortnow-learn-brand-film.mp4; DIR=(1 -1 1 1 1)  # scene 2's card is top-left and drifts down
fi

# 1. Place each voiceover phrase at the start of its scene.
ffmpeg -y -hide_banner -loglevel error -i vo.wav -filter_complex "
[0]atrim=0:5.30,asetpts=N/SR/TB,adelay=500|500[a];
[0]atrim=5.85:8.45,asetpts=N/SR/TB,adelay=5600|5600[b];
[0]atrim=8.85:10.95,asetpts=N/SR/TB,adelay=10400|10400[c];
[0]atrim=11.25:15.05,asetpts=N/SR/TB,adelay=15300|15300[d];
[0]atrim=15.40:18.10,asetpts=N/SR/TB,adelay=20400|20400[e];
[0]atrim=18.85:23.20,asetpts=N/SR/TB,adelay=25400|25400[f];
[a][b][c][d][e][f]amix=inputs=6:normalize=0,aresample=48000,pan=stereo|c0=c0|c1=c0,apad=whole_dur=30.4[vo]" \
  -map "[vo]" -t 30.4 vo_timed.wav

# 2. Scenes (slowed 7% to 5.35 s each) with 0.35 s dissolves on 5 s boundaries, a fade
#    through white into the logo intro, caption cards that fade and drift in, music ducked
#    under the voice, mastered to -14 LUFS.
cap() { # index start end y-direction
  echo "[o$(($1-1))][c$1]overlay=0:'if(between(t,$2,$2+0.6),$4*28*pow(1-(t-$2)/0.6,2),0)':enable='between(t,$2,$3)'[o$1];"
}
ffmpeg -y -hide_banner -loglevel error \
  -i s1.mp4 -i s2.mp4 -i s3.mp4 -i s4.mp4 -i s5.mp4 -i $INTRO \
  -loop 1 -t 31 -i cap1.png -loop 1 -t 31 -i cap2.png -loop 1 -t 31 -i cap3.png -loop 1 -t 31 -i cap4.png -loop 1 -t 31 -i cap5.png \
  -i vo_timed.wav -i music.wav -filter_complex "
$(for i in 0 1 2 3 4; do echo "[$i]setpts=1.07*PTS,fps=30,scale=$W:$H,setsar=1,trim=0:5.35,setpts=PTS-STARTPTS,format=yuv420p[v$((i+1))];"; done)
[5]fps=30,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=1.0[v6];
[v1][v2]xfade=transition=fade:duration=0.35:offset=5.0[x1];
[x1][v3]xfade=transition=fade:duration=0.35:offset=10.0[x2];
[x2][v4]xfade=transition=fade:duration=0.35:offset=15.0[x3];
[x3][v5]xfade=transition=fade:duration=0.35:offset=20.0[x4];
[x4][v6]xfade=transition=fadewhite:duration=0.5:offset=24.85[o0];
[6]format=rgba,fade=in:st=0.6:d=0.6:alpha=1,fade=out:st=4.3:d=0.4:alpha=1[c1];
[7]format=rgba,fade=in:st=5.6:d=0.6:alpha=1,fade=out:st=9.3:d=0.4:alpha=1[c2];
[8]format=rgba,fade=in:st=10.6:d=0.6:alpha=1,fade=out:st=14.3:d=0.4:alpha=1[c3];
[9]format=rgba,fade=in:st=15.6:d=0.6:alpha=1,fade=out:st=19.3:d=0.4:alpha=1[c4];
[10]format=rgba,fade=in:st=20.6:d=0.6:alpha=1,fade=out:st=24.4:d=0.4:alpha=1[c5];
$(cap 1 0.6 4.7 ${DIR[0]})$(cap 2 5.6 9.7 ${DIR[1]})$(cap 3 10.6 14.7 ${DIR[2]})$(cap 4 15.6 19.7 ${DIR[3]})$(cap 5 20.6 24.8 ${DIR[4]})
[o5]trim=0:30.4,format=yuv420p[vout];
[11]aformat=channel_layouts=stereo,asplit=2[vo][sc];
[12]volume=0.55[mus];
[mus][sc]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[duck];
[vo][duck]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:30.4[aout]" \
  -map "[vout]" -map "[aout]" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
