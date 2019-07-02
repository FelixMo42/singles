class Board {
    constructor(width, height, id="board") {
        this.width = width
        this.height = height

        this.root = document.getElementById(id)
        this.value = [
            [4, 2, 1, 2, 1],
            [2, 4, 5, 4, 1],
            [5, 1, 1, 5, 2],
            [5, 2, 3, 1, 3],
            [4, 5, 5, 4, 3]
        ]

        /*for (let y = 0; y < height; y++) {
            this.value[y] = []
            for (let x = 0; x < width; x++) {
                this.value[y][x] = 1
            }
        }*/

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
                        let value = this.block(x, y)

                        if (this.isWinnable()) {
                            console.log("you win!")
                        } else {
                            this.setValue(x, y, value)
                        }
                    }
                })
            }
        }
    }

    isLegal(x, y) {
        return (
            this.getValue(x - 1, y) !== 0 &&
            this.getValue(x + 1, y) !== 0 &&
            this.getValue(x, y - 1) !== 0 &&
            this.getValue(x, y + 1) !== 0
        )
    }

    isWinnable() {
        let winable = true
        let changed = true

        while (changed) {
            changed = false

            this.forEach((x, y) => {
                let pair = this.getPair(x, y)

                if ( !pair ) {
                    document.getElementById(x + "," + y).setAttribute('class', 'open')
                }

                pair.push([x, y])

                if (pair.length == 2) {
                    let a = this.isLegal(...pair[0])
                    let b = this.isLegal(...pair[1])

                    if ( !a && b ) {
                        this.block(...pair[1])
                        changed = true
                    }

                    if ( a && !b ) {
                        this.block(...pair[0])
                        changed = true
                    }

                    if ( !a && !b ) {
                        winable = false
                    }
                }
            })
        }

        return winable
    }

    isAlone(x, y) {
        return this.getPair(x, y) === false
    }

    getPairs() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let pair = this.getPair(x, y)
                if (pair) {
                    return [
                        { x: x, y: y },
                        { x: pair[0], y: pair[1] }
                    ]
                }
            }
        }
    }

    getPair(X, Y) {
        let value = this.getValue(X, Y)

        for (let x = 0; x < this.width; x++) {
            if (x !== X && this.getValue(x, Y) === value) {
                return [[x, Y]]
            }
        }

        for (let y = 0; y < this.height; y++) {
            if (y !== Y && this.getValue(X, y) === value) {
                return [[X, y]]
            }
        }

        return []
    }

    forEach(callback) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.getValue(x, y)) { 
                    callback(x, y)
                }
            }
        }
    }

    block(x, y) {
        this.getElement(x, y).setAttribute('class', 'blocked')
        return this.setValue(x, y, 0)
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
            return -1
        }
        return this.value[x][y]
    }
}

const board = new Board(5, 5)