# Kubernetes + Nginx 기본 실습 정리

---

## 1. 도커 + 쿠버네티스 설치

### Docker 설치
```bash
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io
```

### minikube 실행을 위한 일반 사용자 설정
```bash
useradd dev
passwd dev
usermod -aG wheel,docker dev
sudo -i -u dev
newgrp docker
```

### minikube (Kubernetes 코어)
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

### kubectl (Kubernetes 명령어 도구)
```bash
curl -LO https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl
sudo install kubectl /usr/local/bin/kubectl
```

### 클러스터 상태 확인
```bash
minikube status
kubectl get nodes -o wide
kubectl get pods -A
```

---

## 2. nginx 배포

### Deployment 생성
```bash
kubectl create deployment nginx --image=nginx
kubectl get deployments
kubectl get pods
```

### Service 노출
```bash
kubectl expose deployment nginx --type=NodePort --port=80
kubectl get svc
minikube service nginx --url
curl http://192.168.58.2:31323
```

또는 포트 포워딩:
```bash
kubectl port-forward svc/nginx --address 0.0.0.0 8080:80
```
→ VM IP:8080 으로 접속

---

## 3. nginx-deploy.yaml 작성

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:latest
          ports:
            - containerPort: 80
```

```bash
kubectl apply -f nginx-deploy.yaml
kubectl get pods
```

---

## 4. replica 추가

```bash
kubectl scale deployment nginx --replicas=5
kubectl get pods
```

---

## 5. PVC 스토리지 테스트

### PVC 생성
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nginx-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

```bash
kubectl apply -f nginx-pvc.yaml
kubectl get pvc
```

### Deployment에 PVC 연결
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:latest
          ports:
            - containerPort: 80
          volumeMounts:
            - mountPath: /usr/share/nginx/html
              name: webdata
      volumes:
        - name: webdata
          persistentVolumeClaim:
            claimName: nginx-pvc
```

---

## 6. (CD 단계) 이미지 버전 교체 및 롤백

```bash
kubectl set image deployment/nginx nginx=nginx:1.25
kubectl rollout status deployment/nginx
kubectl get deployment nginx -o wide

kubectl rollout undo deployment/nginx
kubectl get deployment nginx -o wide
```

---

## 전체 흐름 요약

```
배포 → 노출 → 스케일 → 스토리지 → 업데이트 → 롤백
```

실제 운영에서는  
**Git 커밋 → Jenkins 트리거 → kubectl 자동 실행** 구조로 동작함.

---

## nginx 설정(ConfigMap) + PVC 기반 소스 연결

### nginx 설정 ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-conf
data:
  default.conf: |
    server {
      listen 80;
      location / {
        root /usr/share/nginx/html;
        index index.html;
      }
    }
```

```bash
kubectl apply -f nginx-configmap.yaml
```

### Deployment에 ConfigMap + PVC 연결
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
        volumeMounts:
        - name: webdata
          mountPath: /usr/share/nginx/html
        - name: nginx-conf
          mountPath: /etc/nginx/conf.d/default.conf
          subPath: default.conf
      volumes:
      - name: webdata
        persistentVolumeClaim:
          claimName: nginx-pvc
      - name: nginx-conf
        configMap:
          name: nginx-conf
```

```bash
kubectl apply -f nginx-deploy.yaml
kubectl exec -it deploy/nginx -- sh -c 'echo "hello nginx" > /usr/share/nginx/html/index.html'
```

