function nums(num, len) {
    return new Array(len).fill(num);
}

Object.defineProperty(Array.prototype, 'shuffle', {
    value: function() {
        for (let i = this.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
            [this[i], this[j]] = [this[j], this[i]]; // swap elements
        }

        return this
    }
})

Object.defineProperty(Array.prototype, 'random', {
    value: function() {
        return this[Math.floor(Math.random() * this.length)]
    }
})

class Board {
    constructor(width, height, feedback="none", id="board") {
        this.width = width
        this.height = height
        this.feedback = feedback

        this.setUpGrid()

        this.root = document.getElementById(id)

        document.getElementById("helpScreen_keep").addEventListener("click", () => {
            closeDisplay()
        })

        document.getElementById("helpScreen_back").addEventListener("click", () => {
            closeDisplay()
            this.unblock( ...this.badMove )
            this.getElement( ...this.badMove ).setAttribute('class', 'number')
        })

        for (let y = 0; y < height; y++) {

            let row = document.createElement('div')
            row.setAttribute('class', 'row')
            this.root.appendChild(row);

            for (let x = 0; x < width; x++) {

                let number = document.createElement('div')
                number.setAttribute('class', 'number')
                number.setAttribute("id", x + "," + y)
                row.appendChild(number)

                let text = document.createTextNode( this.getValue(x, y) )
                number.appendChild(text)

                number.addEventListener("click", () => {
                    if (this.isLegal(x, y)) {
                        this.block(x, y)
                        this.getElement(x, y).setAttribute('class', 'blocked')

                        if (this.isWin()) {
                            display("winScreen")
                        }

                        let tips = this.getTips()
                        if (!tips.winnable) {
                            this.badMove = [x, y]

                            let tip = document.getElementById("helpScreen_desciption")
                            tip.innerHTML = `In ${tips.turns} turn(s) you will loose!`
                            console.log( `In ${tips.turns} turn(s) you will loose!` )
                            display("helpScreen")
                        }
                    }
                })
            }
        }
    }

    setUpGrid() {
        this.value = []

        for (let x = 0; x < this.height; x++) {
            this.value[x] = []
            for (let y = 0; y < this.width; y++) {
                this.value[x][y] = 1
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
                    let value = values.pop()
                    console.log(prev, values, value)
                    while ( prev.includes(value) ) {
                        values.unshift( value )
                        value = values.pop()
                    }

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

    isLegal(x, y) {
        if (
            this.getValue(x, y) < 0 ||
            this.getValue(x - 1, y) < 0 ||
            this.getValue(x + 1, y) < 0 ||
            this.getValue(x, y - 1) < 0 ||
            this.getValue(x, y + 1) < 0
        ) {
            return false
        }

        if (
            this.willSection(x, y)
        ) {
            return false
        }

        return true
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

    getTips() {
        let changed = true
        let fails = []
        let blocked = []

        while (changed) {
            changed = false

            this.forEach((x, y) => {
                let pairs = this.getPair(x, y)

                for (let pair of pairs) {
                    if (pair.length == 2) {
                        let a = this.isLegal(...pair[0])
                        let b = this.isLegal(...pair[1])

                        if ( !a && b ) {
                            this.block(...pair[1])
                            blocked.push(pair[1])
                            changed = true

                            return
                        }

                        if ( a && !b ) {
                            this.block(...pair[0])
                            blocked.push(pair[0])
                            changed = true

                            return
                        }

                        if ( !a && !b ) {
                            this.getElement( ...pair[0] ).setAttribute("style", "open")
                            this.getElement( ...pair[1] ).setAttribute("style", "open")

                            if (!fails.some((fail) => fail.x !== x || fail.y !== y)) {
                                fails.push({
                                    x: x,
                                    y: y
                                })
                            }
                        }
                    }
                }
            })
        }

        for (let [x, y] of blocked) {
            this.unblock(x, y)
        }

        console.log({
            winnable: fails.length === 0,
            turns: blocked.length,
            tip: fails
        })

        return {
            winnable: fails.length === 0,
            turns: blocked.length,
            fails: fails
        }
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
        //this.getElement(x, y).setAttribute('class', 'blocked')
        return this.setValue(x, y, -this.getValue(x, y))
    }

    unblock(x, y) {
        //this.getElement(x, y).setAttribute('class', 'number')
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

const board = new Board(5, 5)