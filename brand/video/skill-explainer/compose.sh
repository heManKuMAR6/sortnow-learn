#!/usr/bin/env bash
# Composites the explainer: brand background, the Higgsfield 3D shot (hero.mp4) under the
# transparent animation frames (fr/), voiceover (vo.wav) with music ducked underneath.
set -euo pipefail
# Voiceover: tighten the pauses and speed up 8% so it lands at 15 s, one phrase per scene.
ffmpeg -y -hide_banner -loglevel error -i vo.wav -filter_complex "
[0]atrim=0:1.75,asetpts=N/SR/TB,atempo=1.08,adelay=150|150[a];
[0]atrim=2.62:5.45,asetpts=N/SR/TB,atempo=1.08,adelay=2000|2000[b];
[0]atrim=5.82:9.55,asetpts=N/SR/TB,atempo=1.08,adelay=4800|4800[c];
[0]atrim=10.12:14.08,asetpts=N/SR/TB,atempo=1.08,adelay=8350|8350[d];
[0]atrim=14.08:16.85,asetpts=N/SR/TB,atempo=1.08,adelay=12100|12100[e];
[a][b][c][d][e]amix=inputs=5:normalize=0,aresample=48000,pan=stereo|c0=c0|c1=c0,apad=whole_dur=15.2[o]" -map "[o]" -t 15.2 vo_t.wav
ffmpeg -y -loglevel error -i ../film/music.wav -af "atrim=0:15.2,afade=t=out:st=13.4:d=1.8" mus.wav
ffmpeg -y -hide_banner -loglevel error \
 -f lavfi -i color=c=0xFBFBFD:s=1080x1920:r=30:d=15.2 -i hero.mp4 -framerate 30 -i fr/f%04d.png -i vo_t.wav -i mus.wav -filter_complex "
[1]trim=0.6:4.4,setpts=(PTS-STARTPTS)/1.23,fps=30,scale=1080:1920,setsar=1,setpts=PTS+7.85/TB[h];
[0][h]overlay=0:0:eof_action=pass:enable='between(t,7.85,11.0)'[b];
[2]format=rgba[f];[b][f]overlay=0:0:format=auto,format=yuv420p[v];
[3]asplit=2[vo][sc];[4]volume=0.6[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=30:release=400[d];
[vo][d]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:15.2[a]" \
 -map "[v]" -map "[a]" -t 15.2 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart what-is-an-ai-skill.mp4
