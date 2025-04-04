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
5. 추가로, 특정 년도의 (예: 2020년) 파일들을 지금 당장 개별적으로 tar.gz로 압축요청
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

- 파이프 2개에 exit 1 은 cd 실패하면 종료하라는 뜻임
- 여기서 find 명령어는 우리가 아는 그 find 임.
- maxdepth는 하위 디렉토리 안보고 가장 상위 폴더내의 파일만 보겠다는 범위를 설정하는 것임. 타입은 f, 즉 폴더빼고 파일들만.
- mtime +30 이란 modification date이므로 파일의 최종 수정날짜를 기준으로 파일날짜를 계산함 .
- ! -name 이란, 제외할 파일들을 말함. 리눅스나 프로그래밍에서 느낌표는 negative의 성질을 가짐
- while read 는 한줄씩 읽어서 datafile 변수에 저장하라는 뜻임.
```bash
구성 요소	설명
while	조건이 참인 동안 반복 실행
read	표준 입력(또는 파이프)을 한 줄 읽어서 변수에 저장
-r	백슬래시(\) 같은 특수 문자 무시 없이 그대로 읽기
datfile	읽어온 한 줄(여기서는 파일 경로)을 저장할 변수
```

설명:
- do ...done은 반복 실행할 명령어를 명시하는 곳.
- find 명령어를 쓰면 결과 값을 보통 ./filename 이런식으로 반환함. basename 명령어는 경로를 빼고 파일명만 필터링하는 설정임. 즉 ./a.dat -> a.dat로 바꿔줌 (이명령어는 사실 쓸필요없긴함)
- rm 명령어는 원본이 남아있을것이기 때문에 삭제를 위함
- echo는 압축을 정상적으로 처리하면 결과 값을 화면에 뿌려주는 역할

### 2.2 실행권한 부여
```bash
# chmod +x /usr/local/info/compress.sh
```

### 2.3 스케줄러에 매일 새벽 1시에 돌도록 설정 (# crontab -e)
```bash
# crontab -l
0 1 * * * /usr/local/info/compress.sh >> /var/log/compress.log 2>&1
```
- 꺾쇠 2개를 썼기 때문에 파일내용은 계속 누적될 것이고, 2>&1로 stdout표준출력 로그와 stderr표준에러 로그 또한 같이 쌓일것임
```bash
🔍 2>&1
2 : 표준 에러(stderr)
1 : 표준 출력(stdout)
2>&1 : 표준 에러를 표준 출력으로 리다이렉트
→ 즉, 에러 메시지도 포함해서 로그 파일에 저장
```

### 3.1 compress_2020.sh 스크립트 작성하여 지금 당장 개별적으로 압축
```bash
#!/bin/sh

INFO_DIR="/usr/local/info"

cd "$INFO_DIR" || exit 1

for datfile in *-2020*; do
  if [ -f "$datfile" ]; then
    tar -czf "${datfile}.tar.gz" "$datfile" && rm -f "$datfile"
    echo "압축 완료: ${datfile}.tar.gz"
  fi
done
```

설명:
- for 변수이름 in 실제파일 <- 이런 구조로 작성하면됨. 이건 반복문 
- 이프 구문에 -f "$datafile" 는 조회된 파일의 파일타입이 일반파일인지 디렉토리인지를 확인함
- if fi는 이프 조건문에 열고닫기

# Conclusion
- 이런식으로 30일이 지난 로그나 데이터를 압축해서 저장한다면 공간할당에 유리.
- 필요할때마다 압축해제해서 확인도 가능함.
- 타르(tar)는 몸에 나쁨. 담배도 결국 스트레스를 압축시키는 것일뿐, 아이노드 건강에는 더 안좋을 것 같음. (끊은지 8년됨)