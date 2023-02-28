printenv > envprinted
value=`cat envprinted`
result=""
SUB='VUE_'
for VARIABLE in $value
do
	r1=$(echo $VARIABLE | grep $SUB)
	if [ "$r1" != "" ] ; then
  		echo $VARIABLE
		result=$result$VARIABLE";"
	fi
done
echo "$result" > envslepok
value=`cat envslepok`
for VARIABLE in $value
do
	echo $VARIABLE
	sed -i "s@__STRING__@$VARIABLE@" /usr/share/nginx/html/envconfig.js
	break
done
