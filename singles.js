class Board {
    constructor(width, height, id=Math.randomInt(4294967296)) {
        Math.seedrandom(id)

        this.id = id
        this.width = width
        this.height = height
        this.move = 0
        this.feedback = Math.randomInt(3)

        this.setUpGrid()

        this.root = document.getElementById("board")

        document.getElementById("helpScreen_keep").addEventListener("click", () => {
            closeDisplay()
            this.lost = true

            this.log(...this.badMove, "advice_rejected", this.getFeedback())
        })

        document.getElementById("helpScreen_back").addEventListener("click", () => {
            closeDisplay()
            this.unblock( ...this.badMove )

            this.log(...this.badMove, "advice_accepted", this.getFeedback())
        })

        for (let y = 0; y < height; y++) {
            let row = document.createElement('div')
            row.setAttribute('class', 'row')

            for (let x = 0; x < width; x++) {
                let number = document.createElement('div')
                number.setAttribute('class', 'number')
                number.setAttribute("id", x + "," + y)

                let text = document.createTextNode( this.getValue(x, y) )
                number.appendChild(text)

                number.addEventListener("click", () => { this.play(x, y) })           

                row.appendChild(number)
            }

            this.root.appendChild(row);
        }
    }

    log(x, y, type, feedback="") {
        let data = {
            id: this.id,
            move: this.move,
            x: x, y: y,
            type: type,
            feedback: feedback
        }

        console.debug(data)

        if (false) {
            var xhr = new XMLHttpRequest()
            xhr.open("POST", "../saveMove", true)
            xhr.setRequestHeader('Content-Type', 'application/json')

            xhr.send(JSON.stringify(data))
        }
    }

    play(x, y) {
        if (this.isLegal(x, y)) {
            this.move += 1
            this.block(x, y)

            if (this.isWin()) {
                display("winScreen")

                this.log(x, y, "win")

                return
            }

            let tips = this.getTips(x, y)
            if (!tips.winnable && !this.lost) {
                this.badMove = [x, y]

                this.setFeedback(tips)                         

                display("helpScreen")

                return
            }

            if (this.isLose()) {
                display("loseScreen")

                this.log(x, y, "lose")

                return
            }

            this.log(x, y, "good")
        }
    }

    setFeedback(tips) {
        let tip = document.getElementById("helpScreen_desciption")

        this.feedback = 0

        if (this.feedback === 0) { // simple
            let pairs = tips.fails[0].pair
            let number = this.getValue(...pairs[0])
            let direction = pairs[0][0] === pairs[1][0] ? "column" : "row"
            let over = (direction === "row" ? pairs[0][1] : pairs[0][0]) + 1
            tip.innerHTML = `You will not be able to cover the ${number}s in ${direction} ${over}.`
        }

        if (this.feedback === 1) { // complex
           tip.innerHTML = `TODO`
        }

        if (this.feedback === 2) { // plasuble lie
            let dir = Math.randomInt(1)
            
            let x = Math.randomInt(4)
            let y = Math.randomInt(4)

            while ( this.getPair(x, y)[dir].length === 1 ) {
                dir = Math.randomInt(1)
            
                x = Math.randomInt(4)
                y = Math.randomInt(4)
            }

            let number = this.getValue(x, y)
            let over = (dir === 0 ? y : x) + 1
            let direction = ["row", "column"][dir]

            tip.innerHTML = `You will not be able to cover the ${number}s in ${direction} ${over}.`
        }

        if (this.feedback === 3) { // absurd lie
            let dir = Math.randomInt(1)
            
            let x = Math.randomInt(4)
            let y = Math.randomInt(4)

            while ( this.getPair(x, y)[dir].length !== 1 ) {
                dir = Math.randomInt(1)
            
                x = Math.randomInt(4)
                y = Math.randomInt(4)
            }

            let number = this.getValue(x, y)
            let over = (dir === 0 ? y : x) + 1
            let direction = ["row", "column"][dir]

            tip.innerHTML = `You will not be able to cover the ${number}s in ${direction} ${over}.`
        }

        return tip.innerHTML
    }

    getFeedback() {
        return document.getElementById("helpScreen_desciption").innerHTML
    }

    setUpGrid() {
        this.value = []

        for (let x = 0; x < this.height; x++) {
            this.value[x] = []
            for (let y = 0; y < this.width; y++) {
                this.value[x][y] = 10
            }
        }

        let maxBlocks = 7
        let blocks = [
            ...nums(true, maxBlocks),
            ...nums(false, 5 * 5 - maxBlocks),
        ].shuffle()

        for (let x = 0; x < this.height; x++) {
            for (let y = 0; y < this.width; y++) {
                if ( blocks.pop() ) {
                    if (!this.isLegal(x, y)) {
                        this.setUpGrid()
                        return
                    }

                    this.setValue(x, y, -[1, 2, 3, 4, 5].random())
                }
            }
        }

        for (let x = 0; x < this.height; x++) {
            let values = [1, 2, 3, 4, 5].shuffle()
            for (let y = 0; y < this.width; y++) {
                if ( this.getValue(x, y) > 0 ) {
                    let prev = new Array(x).fill(0).map( (v, i) => this.getValue(i, y) )
                    let value = values.filter((v) => !prev.includes(v)).pop()

                    if (!value) {
                        this.setUpGrid()
                        return
                    }

                    values.splice( values.indexOf(value), 1 )

                    this.setValue(x, y, value)
                }
            }
        }

        for (let x = 0; x < this.height; x++) {
            for (let y = 0; y < this.width; y++) {
                this.setValue(x, y, Math.abs(this.getValue(x, y)))
            }
        }
    }

    isLegal(x, y, reason=false) {
        if (
            this.getValue(x, y) < 0 ||
            this.getValue(x - 1, y) < 0 ||
            this.getValue(x + 1, y) < 0 ||
            this.getValue(x, y - 1) < 0 ||
            this.getValue(x, y + 1) < 0
        ) {
            return reason ? "adjacent" : false
        }

        if (
            this.willSection(x, y)
        ) {
            return reason ? "section" : false
        }

        return reason ? "" : true
    }

    willSection(x, y) {
        this.block(x, y)

        // get total number of unblocked numbers
        let total = 0
        this.forEach( () => {
            total += 1
        } )

        let sectioned = [
            this.getSection(x - 1, y).length,
            this.getSection(x + 1, y).length,
            this.getSection(x, y - 1).length,
            this.getSection(x, y + 1).length
        ]

        this.unblock(x, y)

        return !sectioned.includes(total)
    }

    getSection(x, y, section=[]) {
        let stringForm = this.stringify(x, y)

        if (this.getValue(x, y) <= 0 || section.includes(stringForm)) {
            return section
        }
        
        section.push(stringForm)
        
        section = this.getSection(x - 1, y, section)
        section = this.getSection(x + 1, y, section)
        section = this.getSection(x, y - 1, section)
        section = this.getSection(x, y + 1, section)

        return section
    }

    stringify(x, y) {
        return x + "," + y
    }

    isWin() {
        let win = true

        this.forEach((x, y) => {
            let pairs = this.getPair(x, y)
            
            pairs.forEach( (pair) => {
                if (pair.length > 1) {
                    win = false
                }
            } )
        })

        return win
    }

    isLose() {
        let lose = true

        this.forEach((x, y) => {
            if (this.isLegal(x, y)) {
                lose = false
            }
        })

        return lose
    }

    getTips(x, y) {
        let changed = true
        let fails = []
        let blocked = []

        let block = (x, y) => {
            if (!this.isLegal(x, y)) { return false }

            this.block(x, y)
            blocked.push([x, y])
            changed = true

            return true
        }

        let nums = []
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                nums.push([x, y])
            }
        }

        if (x !== undefined && y !== undefined) {
            nums.sort( (a, b) => a.dist(x, y) - b.dist(x, y) )
        }

        while (changed) {
            changed = false

            this.getTips_fails(nums, fails)
            this.getTips_play(nums, block)

            if (fails.length > 0) {
                break
            }
        }

        if (!params.has('debug')) {
            for (let [x, y] of blocked) {
                this.unblock(x, y)
            }
        }

        return {
            winnable: fails.length === 0,
            turns: blocked.length,
            fails: fails
        }
    }

    getTips_fails(nums, fails) {
        for (let [x, y] of nums) {
            if (this.getValue(x, y) < 0) { continue }
            let pairs = this.getPair(x, y)
            console.log(x, y)
            for (let pair of pairs) {
                if (pair.length > 1) {
                    let playables = pair.map(([x, y]) => this.isLegal(x,y))

                    if ( playables.indexOf(true) === -1 ) {
                        console.log("^ FAIL ^")
                        fails.push({
                            pair: pair,
                            fails: pair.map(([x, y]) => this.isLegal(x, y))
                        })
                    }
                }

                if (pair.length > 2) {
                    let groups = this.getGroups(pair)
                    
                    if (groups[0].length === 3) {
                        if (!this.isLegal( ...groups[0][0] ) || this.isLegal( ...groups[0][2] )) {
                            fails.push({
                                pair: pair,
                            })
                        }
                    }

                    if (groups[0].length === 2) {
                        if(!this.isLegal( ...groups[1][0] )) {
                            fails.push({
                                pair: pair
                            })
                        }
                    }
                }
            }
        }
    }

    getTips_play(nums, block) {
        for (let [x, y] of nums) {
            if (this.getValue(x, y) < 0) { continue }
            let pairs = this.getPair(x, y)

            for (let pair of pairs) {
                if (pair.length > 1) {
                    let playables = pair.map(([x, y]) => this.isLegal(x,y))
                    let playableIndex = playables.onlyOne(true)
                    
                    if (playableIndex !== -1) {
                        return block(...pair[playableIndex])
                    }
                }

                if (pair.length > 2) {
                    let groups = this.getGroups(pair)
                    
                    if (groups[0].length === 3) {
                        block( ...groups[0][0] )
                        block( ...groups[0][2] )

                        return
                    }

                    if (groups[0].length === 2) {
                        block( ...groups[1][0] )

                        return
                    }
                }
            }
        }
    }

    getGroups(pair) {
        let prevX = pair[0][0] - 1
        let prevY = pair[0][1] - 1
        let group = []
        let groups = []

        for (let [x, y] of pair) {
            if (x !== prevX + 1 && y !== prevY + 1) {
                groups.push(group)
                group = []
            }
            group.push([x, y])
            prevX = x
            prevY = y
        }

        groups.push(group)
        groups.sort( (group) => group.length )

        return groups
    }



    playGroup(group, block, fails) {
        let playable = group.map(([x, y]) => this.isLegal(x,y))
        
        let playableIndex = playable.onlyOne(true)
        let unplayable = playable.indexOf(true) === -1

        if (playableIndex !== -1) {
            block(...group[playableIndex])
        }

        if (unplayable) {
            //if (!fails.some((fail) => fail.x !== x || fail.y !== y)) {
                fails.push({
                    pair: group,
                    fails: group.map(([x, y]) => this.isLegal(x, y, true))
                })
            //}
        }

        return playableIndex !== -1
    }

    isAlone(x, y) {
        return this.getPair(x, y) === false
    }

    getPair(x, y) {
        let value = this.getValue(x, y)
        let row = []
        let column = []

        for (let x = 0; x < this.width; x++) {
            if (this.getValue(x, y) === value) {
                row.push([x, y])
            }
        }

        for (let y = 0; y < this.height; y++) {
            if (this.getValue(x, y) === value) {
                column.push([x, y])
            }
        }

        return [row, column]
    }

    forEach(callback) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.getValue(x, y) > 0) {
                    callback(x, y)
                }
            }
        }
    }

    block(x, y) {
        if (this.getElement(x, y)) {
            this.getElement(x, y).setAttribute('class', 'blocked')
        }
        return this.setValue(x, y, -this.getValue(x, y))
    }

    unblock(x, y) {
        if (this.getElement(x, y)) {
            this.getElement(x, y).setAttribute('class', 'number')
        }
        return this.setValue(x, y, -this.getValue(x, y))
    }

    getElement(x, y) {
        return document.getElementById(x + "," + y)
    }

    setValue(x, y, value) {
        let oldValue = this.getValue(x, y)
        this.value[x][y] = value
        return oldValue
    }

    getValue(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return 0
        }
        return this.value[x][y]
    }
}

let params = new URLSearchParams(window.location.search)

const board = new Board(5, 5, params.getInt('id'))