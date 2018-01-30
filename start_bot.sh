#eg
#sh start_bot.sh -SKEY_BOT=sub-c-??? -PKEY_BOT=pub-c-??? -SKEY_SVR=sub-c-??? -PKEY_SVR=pub-c-??? -app=???
while true; do
	node bot $*
	sleep 1
done
