## calling go func directly

```
import { Test } from '../../wailsjs/go/app/App';

    function handleTest() {
        Test().then((result) => {
            alert(`Test() returned: ${result}`); // Show the result in an alert
        }).catch((error) => {
            console.error("Error calling Test():", error);
        });
    }
```


## cant cross compile fo PI


on pi (cnc):
wails init -n go2cnc -t react
cnd go2cnc
rm -rf frontend/src/*
rm main.go app.go go.mod go.sum

on dev:
scp -r go2cnc/frontend/src/* cnc:/tmp/go2cnc/frontend/src/
scp -r go2cnc/pkg cnc:/tmp/go2cnc/
scp go2cnc/go.mod cnc:/tmp/go2cnc/
scp go2cnc/go.sum cnc:/tmp/go2cnc/
scp go2cnc/*.go cnc:/tmp/go2cnc/

on pi (cnc):
cd frontend
npm install react-ace @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome react-router-dom

wails build


---------------------------------
git clone https://github.com/redt1de/go2cnc
cd go2cnc
cd frontend npm install .
cd ..
DISPLAY=:0 wails dev