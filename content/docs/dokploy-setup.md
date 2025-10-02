📥 1. Install Dokploy and allow port 3000 in firewall

```bash
sudo ufw allow from YOUR_IP_ADDRESS to any port 3000
```

```bash
curl -sSL https://dokploy.com/install.sh | sudo sh
```


2. Add domain for security purposes
navigate to the given url under port 3000

then add domain under settings > web server

3. setup github 

settings > git
create github app and also enable daily docker cleanup

