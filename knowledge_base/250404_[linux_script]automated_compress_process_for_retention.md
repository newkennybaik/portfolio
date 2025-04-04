# Automated Compress Scripts Overview
- 리눅스 서버에 특정/애플리케이션을 쓰다보면 더이상 쓰지 않는 오래된 로그나 데이터를 감사 목적으로 보관해야하는 상황이 생김.(Archive)
- 일반적으로 보관주기를 설정해놓으면, 자동으로 삭제하는 기능은 존재하지만 압축해서 보관하는 기능은 제공하지 않음
- .tar.gz 형식으로 압축을 해서 보관하기만해도 개당 100MB짜리 파일을 100KB ~ 10MB 크기로 줄이는 것이 가능함.


## 1. tar 명령어 사용 예시
- tar -cvpzf, -cpzf, -czf 옵션은 이렇게 많이 사용됨

```bash
✅ 각 옵션의 의미
옵션	의미
c	새 아카이브 생성 (create)
v	자세히 출력 (verbose)
p	권한 보존 (preserve permissions)
z	gzip으로 압축 (gzip compress)
f	파일 이름 지정 (file) – 반드시 마지막에 나와야 함
```

### 1.1 tar로 압축 후, 파일 크기 비교
```bash
# du -sh ./*
2.5G    ./Postian
1.3G    ./Postian.tar.gz

# du -sh ./*
103M    ./test.pdf
104K    ./test.tar.gz

```

## 2. 고객사에 실제 사용한 스크립트
고객사 요청사항:
```bash
1. /usr/local/info 내의 대량 파일 압축
2. 30일이 초과된 파일들만 압축, 가장 최근 30일 데이터는 원본 상태로 유지
3. 한꺼번에 압축하는 것이 아닌 개별적으로 tar.gz 형태로 보존
4. 새벽 1시에 해당 배치가 돌도록 설정 요청

```

### 2.1 compress.sh 스크립트 작성

```bash
#!/bin/sh

INFO_DIR="/usr/local/info/"

cd "$INFO_DIR" || exit 1

# 30일 초과된 파일 중에서 .tar.gz 제외. 제외하지 않으면 tar.gz로 한번 압축된 파일이 시일에 따라 tar.gz로 이중 삼중으로 압축될 수 있음
find . -maxdepth 1 -type f -mtime +30 ! -name "*.tar.gz" | while read -r datfile; do

  base=$(basename "$datfile")
  tar -czf "${base}.tar.gz" "$base" && rm -f "$base"
  echo "압축 완료: ${base}.tar.gz"
  
done
```

### 2.2 실행권한 부여
```bash
# chmod +x /usr/local/info/compress.sh
```

### 2.3 스케줄러에 매일 새벽 1시에 돌도록 설정 (# crontab -e)
```bash
# crontab -l
0 1 * * * /usr/local/info/compress.sh >> /var/log/compress.log 2>&1
```

# Conclusion
- 이런식으로 30일이 지난 로그나 데이터를 압축해서 저장한다면 공간할당에 유리.
- 필요할때마다 압축해제해서 확인도 가능함.
- 타르(tar)는 몸에 나쁨. 담배도 결국 스트레스를 압축시키는 것일뿐, 아이노드 건강에 안좋음.