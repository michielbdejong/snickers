echo building lamp
cd backends/src/lamp
tar -cvf ../../tar/lamp.tar *
echo building wordpress
cd ../../src/wordpress
tar -cvf ../../tar/wordpress.tar *
echo building known
cd ../../src/known
tar -cvf ../../tar/known.tar *
echo building trovebox
cd ../../src/trovebox
tar -cvf ../../tar/trovebox.tar *
echo building owncloud
cd ../../src/owncloud
tar -cvf ../../tar/owncloud.tar *
echo building tosdr2-pre
cd ../../src/tosdr2-pre
tar -cvf ../../tar/tosdr2-pre.tar *
echo building tosdr2-dev
cd ../../src/tosdr2-dev
tar -cvf ../../tar/tosdr2-dev.tar *
