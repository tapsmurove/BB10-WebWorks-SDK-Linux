This is the BB10 SDK 1.0.2.9 beta ported to linux.

This repo is a ready to go webworks sdk  and ripple servies for linux

To get started u r computer need to have installed:

java (requied by BlackBerry)
gcc-c++ (building nodejs)
node (ripple services)

get nodejs from nodejs.org

./configure
make
copy this folder into the "dependencies/node/"

make install

then kudos

./rippleserver.sh (this will get you running ripple services)

place your debugtoken (rename to debugtoken.bar) in sdk folder

BLACKBERRY - Auth

For signing, debuging and other authentication

Please your author.p12, barsigner.csk, client-PBDT-xxxxxx.csj, client-RDK-xxxxxx.csj

/home/{username}/.rim/		(if directory is not there, please create one)

additional tools are found in /dependencies/tools/bin

blackberry-debugtokenrequest -storepass <KeystorePassword> -devicepin <device PIN> <debug_token_file_name.bar>

Tested on:

openSUSE 12.2(64bit)
Ubuntu 12.04(32bit)

Thanks to badtoyz for webworks-linux-api's 

https://github.com/badtoyz/BB10-WebWorks-SDK-Linux

for any furthur information

twitter: @kanishkablack
