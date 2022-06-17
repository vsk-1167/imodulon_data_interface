<b>Setuo</b>

<i>Connecting to the internet requires two steps: </i>

<ul>
<li>python3 -m http.server 8000 ==> in waffle</li>
<li>ssh waffle -D 8000 ==> in computer </li>
<li>set up SOCKS HOST as localhost in port 8000 on Firefox locally</li>
<li>access website with: http://0.0.0.0:8000/{filename}</li>
</ul>

Sourced from this stackoverflowpost: https://stackoverflow.com/questions/21124869/how-to-view-html-file-in-remote-unix-server
