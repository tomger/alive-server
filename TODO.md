Alive

npm install
npm start



This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

http://developer.sketchapp.com/introduction/

https://github.com/abynim/Sketch-Headers/blob/master/Headers/MSDocument.h

defaults write ~/Library/Preferences/com.bohemiancoding.sketch3.plist AlwaysReloadScript -bool YES

http://developer.sketchapp.com/introduction/preferences/


EC2: sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080


wobble = () ->
    for toggle in layers.toggles.children
        knob = children[0]
        x = if Math.random() >.5 then 32 else 0
        knob.animate
            properties: x: x
            time: .3
            curve: 'ease-in'
    Utils.delay 1, wobble
wobble()

# layers.dialog.bringToFront()
# # fab.onClick -> layers.dialog.visible = yes
# # layers.dialog.onClick -> @visible = no

# fab.onClick ->
#     layers.dialog.visible = yes
#     layers.dialogFog.opacity = 0
#     layers.dialogContent.opacity = 0
#     layers.dialogContent.y = Align.center(-50)
#     layers.dialogFog.animate
#         properties:
#             opacity: 1
#         time: 0.3
#     layers.dialogContent.animate
#         properties:
#             opacity: 1
#             y: Align.center
#         curve: 'spring(150, 20, 10)'
#         delay: 0.2

# layers.dialog.onClick -> @visible = no
