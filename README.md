# Harbormaster

```
docker run -d --name=harbormaster --network main --restart=always -v /data/harbormaster/data:/data -v /var/run:/var/run -e REGISTRY_HOST=registry:5000 -p 5003:5000 wfong/harbormaster
```
