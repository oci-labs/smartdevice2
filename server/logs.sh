#!/bin/bash
# This outputs logs for the web/REST server pod.

serverName=`kubectl describe pods devo-server | grep "^Name:" | awk '{print $2}'`
kubectl logs $serverName
