# How to use Git(깃 사용법)
This has been written for the purpose of testing and to specify how to use git from scratch.

## Features(기능)


### 깃 세팅
1. Git 공식 홈페이지에서 Git for Windows 설치파일 다운로드 후 설치

2. CMD 창 열고 버전 확인이 된다면 설치완료
    > git --version

3. Git Repository 윈도우와 연동
    > git clone https://github.com/newkennybaik/portfolio (로컬에 지정할 위치에서 명령어 실행)
    > cd portfolio (실제위치: C:\Users\USER\portfolio)
    > git remote -v

4. Config 설정
    > git config --global user.name "Your Name"
    > git config --global user.email "your_email@example.com"

5. 로컬 윈도우에서 원하는 만큼 수정

6. 실제 github 페이지에 적용
    > git init                      # Git 저장소 초기화
    > git add .                     # 모든 파일 Git에 추가
    > git commit -m "test2"         # 변경 사항 저장
    > git remote add origin <원격 저장소 주소>  # GitHub 연결
    > git push -u origin main       # GitHub에 업로드