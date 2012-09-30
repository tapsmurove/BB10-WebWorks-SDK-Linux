This is the BB10 SDK 1.0.2.9 beta ported to linux.
This sdk is based off of the windows install not the commuinty repo. we are in the works of getting it to work from the repo

This repo is a ready to go webworks sdk for linux, windows and mac

What we had to do to port the sdk

compile node.js v0.6.10 for linux and put it in /dependencies/node/node.linux

move the mac node to /dependencies/node/node.mac

chmod + x the files in /dependencies/tools/bin

edit /lib/signing-helper.js 

made bbwp for linux and mac

thanks to 

Joe Scott

Rory Craig-Barnes (@roryboy)
