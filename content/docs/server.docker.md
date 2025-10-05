
---

### 🐋 5. Docker Commands Related to Networking

```bash
sudo docker ps
# List all running Docker containers

docker exec -it <container_id> sh
# Enter a shell inside a running Docker container

docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <container_id>
# Get the IP address of a Docker container
```

---

### 🛡 6. Traefik and Dokploy

```bash
docker exec -it <traefik_container_id> sh -c "ip addr"
# Check the IP addresses of Traefik container interfaces
# Example:
# eth0 → 172.17.0.2/16 (docker0)
# eth3 → 172.22.0.3/16 (custom bridge)
# eth1 → 10.0.1.9/24 (overlay/docker_gwbridge)
```


